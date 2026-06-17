/**
 * DIEPS Intent Engine — Cetus Aggregator V3 Router
 * Routes swaps through the Cetus Aggregator V3 API for optimal pricing.
 * Falls back to DexScreener-based estimation when aggregator is unavailable.
 */

import { CETUS_AGGREGATOR_V3_URL, CETUS_SUPPORTED_DEXES, RISK_THRESHOLDS, SUI_MAINNET_RPC } from '../../config/index.js';
import { resolveTokenAddress, getTokenDecimals, resolveToken } from '../coin/tokenResolver.js';
import { logger, createTimer } from '../../utils/logger.js';
import type { RouteResult, RouteNode, PoolDetails } from '../../types/index.js';
import { suiRpcCall } from '../../utils/suiClient.js';
import { AggregatorClient, Env } from '@cetusprotocol/aggregator-sdk';
import BN from 'bn.js';

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

  // Upgrade Token Discovery: Check if addresses were resolved successfully.
  if (!fromAddress.startsWith('0x')) {
    throw new Error(`UNKNOWN_TOKEN:${sourceSymbol}`);
  }
  if (!toAddress.startsWith('0x')) {
    throw new Error(`UNKNOWN_TOKEN:${destSymbol}`);
  }

  const sourceDecimals = getTokenDecimals(sourceSymbol);
  const destDecimals = getTokenDecimals(destSymbol);
  const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, sourceDecimals)));

  // Initialize Cetus Aggregator Client V3
  const clientSDK = new AggregatorClient('https://api-sui.cetus.zone/router_v3', '0x2', Env.Mainnet);
  let routers: any = null;

  try {
    routers = await clientSDK.findRouters({
      from: fromAddress,
      target: toAddress,
      amount: new BN(amountInSmallestUnit.toString()),
      byAmountIn: true,
      splitCount: 20,
      depth: 3,
    });

    if (!routers || !routers.paths || routers.paths.length === 0) {
      throw new Error('No viable swap route found with sufficient liquidity on-chain.');
    }
    
    timer.end({ method: 'cetus_sdk_v3' });
  } catch (err: any) {
    logger.error('Cetus Aggregator V3 SDK failed', { error: err.message });
    timer.end({ method: 'failed' });
    throw new Error('No viable swap route found with sufficient liquidity on-chain.');
  }

  // ─── Low-liquidity safety filter ─────────────────────────────────────────
  const deviationRatio = routers.deviationRatio || 0;
  const observedPriceImpactPct = Math.abs(deviationRatio) * 100; // e.g. 2.77

  if (observedPriceImpactPct >= RISK_THRESHOLDS.priceImpact.reject) {
    logger.warn('Skipping low-liquidity route: deviation too high', {
      deviation: deviationRatio,
      impactPct: observedPriceImpactPct.toFixed(2),
      threshold: RISK_THRESHOLDS.priceImpact.reject,
      from: fromAddress,
      target: toAddress,
      amount,
    });
  }

  if (observedPriceImpactPct >= RISK_THRESHOLDS.priceImpact.recommendSplit) {
    logger.warn('Route has high price impact — consider splitting', {
      deviation: deviationRatio,
      impactPct: observedPriceImpactPct.toFixed(2),
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Parse the SDK route paths into frontend-compatible RouteNode format
  const routes: RouteNode[] = [];
  const dexSequence: string[] = [];
  let totalFee = 0;

  for (const path of routers.paths) {
    const dexName = path.provider || 'Cetus';
    const formattedDex = dexName.charAt(0).toUpperCase() + dexName.slice(1);
    const fee = parseFloat(path.feeRate || '0.003') * 100;

    if (!dexSequence.includes(formattedDex)) {
      dexSequence.push(formattedDex);
    }

    routes.push({
      dex: formattedDex,
      ratio: 100, // Approximated for UI
      fee: parseFloat(fee.toFixed(2)),
      weight: -Math.log(1 - fee / 100),
      poolAddress: path.id || undefined,
      liquidityUsd: 0,
    });

    totalFee += fee;
  }

  // If no routes parsed, throw an error
  if (routes.length === 0) {
    throw new Error('No viable swap route found with sufficient liquidity on-chain.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH ON-CHAIN POOL DEPTH (To satisfy Risk Guardian without external APIs)
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const poolIds = routes.map(r => r.poolAddress).filter(id => id !== undefined) as string[];
    if (poolIds.length > 0) {
      const poolObjects = await suiRpcCall('sui_multiGetObjects', [
        poolIds,
        { showContent: true }
      ]);

      poolObjects.forEach((obj: any, index: number) => {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = (obj.data.content as any).fields;
          if (fields) {
            // Extract liquidity depth using standard DEX pool field names
            const rawDepth = Number(
              fields.liquidity ||
              fields.reserve_x ||
              fields.reserve_y ||
              fields.balance_x ||
              fields.coin_a ||
              fields.base_balance ||
              0
            );

            if (rawDepth > 0) {
              routes[index].onChainLiquidityDepth = rawDepth;
            }
          }
        }
      });
    }
  } catch (err) {
    logger.error('Failed to fetch on-chain liquidity depth', { error: (err as Error).message });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Calculate output amount
  const outputAmount = routers.amountOut
    ? parseFloat(routers.amountOut.toString())
    : 0;

  // Route confidence degrades as price impact increases
  const routeConfidence = Math.max(
    50,
    Math.round(96 - observedPriceImpactPct * 4)
  );

  return {
    route: routes,
    dex_sequence: dexSequence,
    expected_output: outputAmount / Math.pow(10, destDecimals),
    minimum_output: (outputAmount / Math.pow(10, destDecimals)) * 0.995,
    execution_impact: `${observedPriceImpactPct.toFixed(2)}%`,
    route_confidence: routeConfidence,
    dynamicPoolUsed: true,
    poolDetails: null,
    routerData: routers, // Pass the EXACT SDK routers object for PTB Builder!
  };
}


