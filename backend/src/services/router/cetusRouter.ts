/**
 * DIEPS Intent Engine — Cetus Aggregator V3 Router
 * Routes swaps through the Cetus Aggregator V3 API for optimal pricing.
 * Falls back to DexScreener-based estimation when aggregator is unavailable.
 */

import { CETUS_AGGREGATOR_V3_URL, CETUS_SUPPORTED_DEXES } from '../../config/index.js';
import { resolveTokenAddress, getTokenDecimals, resolveToken } from '../coin/tokenResolver.js';
import { logger, createTimer } from '../../utils/logger.js';
import type { RouteResult, RouteNode, PoolDetails } from '../../types/index.js';

/**
 * Find the optimal swap route using Cetus Aggregator V3.
 * Returns route data compatible with the frontend's expected format.
 */
export async function findOptimalRoute(
  sourceSymbol: string,
  destSymbol: string,
  sourceAddress: string,
  destAddress: string,
  amount: string
): Promise<RouteResult> {
  const timer = createTimer('findOptimalRoute');

  // Resolve addresses if needed
  const fromAddress = sourceAddress || await resolveTokenAddress(sourceSymbol);
  const toAddress = destAddress || await resolveTokenAddress(destSymbol);
  const sourceDecimals = getTokenDecimals(sourceSymbol);
  const destDecimals = getTokenDecimals(destSymbol);
  const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, sourceDecimals)));

  // Try Cetus Aggregator V3 first
  try {
    const result = await fetchCetusRoute(fromAddress, toAddress, amountInSmallestUnit.toString(), sourceDecimals, destDecimals);
    if (result) {
      timer.end({ method: 'cetus_v2', dexes: result.dex_sequence });
      return result;
    }
  } catch (err: any) {
    logger.error('Cetus Aggregator V2 failed', { error: err.message });
  }

  // If Cetus fails, we do not use off-chain APIs. We reject the route.
  timer.end({ method: 'failed' });
  throw new Error('No viable swap route found with sufficient liquidity on-chain.');
}

/**
 * Fetch route from Cetus Aggregator V3 API.
 */
async function fetchCetusRoute(
  from: string,
  target: string,
  amount: string,
  sourceDecimals: number,
  destDecimals: number
): Promise<RouteResult | null> {
  // Build request URL with query params
  const params = new URLSearchParams({
    from,
    target,
    amount,
    by_amount_in: 'true',
    depth: '3',
    split_count: '20',
  });

  const url = `${CETUS_AGGREGATOR_V3_URL}?${params.toString()}`;
  logger.debug('Calling Cetus V3 API', { url: url.slice(0, 150) + '...' });

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Cetus API HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();

  if (!data || data.code !== 200 || !data.data) {
    logger.warn('Cetus V3 returned no routes', { response: JSON.stringify(data).slice(0, 300) });
    if (data && data.msg === 'quote deviation error') {
      throw new Error('Price impact is too high for this trade size. Please reduce the amount.');
    }
    return null;
  }

  const routeData = data.data;

  // Parse the route into frontend-compatible format
  const routes: RouteNode[] = [];
  const dexSequence: string[] = [];
  let totalFee = 0;

  if (routeData.routes && routeData.routes.length > 0) {
    for (const path of routeData.routes) {
      const pathRatio = parseFloat(path.amount_in?.percentage || '100');

      if (path.path && path.path.length > 0) {
        for (const hop of path.path) {
          const dexName = hop.provider || 'Cetus';
          const formattedDex = dexName.charAt(0).toUpperCase() + dexName.slice(1);
          const fee = parseFloat(hop.fee_rate || '0.003') * 100; // Convert to percentage

          if (!dexSequence.includes(formattedDex)) {
            dexSequence.push(formattedDex);
          }

          routes.push({
            dex: formattedDex,
            ratio: Math.round(pathRatio),
            fee: parseFloat(fee.toFixed(2)),
            weight: -Math.log(1 - fee / 100),
            poolAddress: hop.pool || hop.id || undefined,
            liquidityUsd: hop.liquidity_usd || hop.liquidity || 0,
          });

          totalFee += fee;
        }
      }
    }
  }

  // If no routes parsed, throw an error
  if (routes.length === 0) {
    throw new Error('No viable swap route found with sufficient liquidity on-chain.');
  }

  // Calculate output amount
  const outputAmount = routeData.output_amount
    ? parseFloat(routeData.output_amount)
    : routeData.amount_out
      ? parseFloat(routeData.amount_out)
      : 0;

  // Calculate price impact
  const priceImpact = routeData.price_impact
    ? parseFloat(routeData.price_impact)
    : totalFee / 100;

  return {
    route: routes,
    dex_sequence: dexSequence,
    expected_output: outputAmount / Math.pow(10, destDecimals),
    minimum_output: (outputAmount / Math.pow(10, destDecimals)) * 0.995,
    execution_impact: `${(priceImpact * 100).toFixed(2)}%`,
    route_confidence: 96,
    dynamicPoolUsed: true,
    poolDetails: null,
    routerData: routeData, // Save raw data for PTB building
  };
}


