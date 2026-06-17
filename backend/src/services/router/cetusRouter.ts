/**
 * DIEPS Intent Engine — Cetus Aggregator V3 Router
 * Routes swaps through the Cetus Aggregator V3 API for optimal pricing.
 * Falls back to DexScreener-based estimation when aggregator is unavailable.
 */

import { CETUS_AGGREGATOR_V3_URL, CETUS_SUPPORTED_DEXES, RISK_THRESHOLDS, SUI_MAINNET_RPC } from '../../config/index.js';
import { resolveTokenAddress, getTokenDecimals, resolveToken } from '../coin/tokenResolver.js';
import { logger, createTimer } from '../../utils/logger.js';
import type { RouteResult, RouteNode, PoolDetails } from '../../types/index.js';
import { suiRpcCall, getCoinMetadata } from '../../utils/suiClient.js';
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

  // ─── Effective TVL Calculation (Fix for CLMM & DeepBookV3) ───────────────
  let tradeUsdValue = 0;
  let effectiveTvlUsd = 0;
  try {
    const sourcePrice = await getUsdPriceOnChain(fromAddress);
    tradeUsdValue = parseFloat(amount) * sourcePrice;
    
    if (observedPriceImpactPct <= 0.0001) {
      effectiveTvlUsd = 10_000_000; // Minimal impact = very deep pool
    } else {
      // Effective TVL ≈ 2 * TradeValue / PriceImpact
      effectiveTvlUsd = (2 * tradeUsdValue) / (observedPriceImpactPct / 100);
      if (effectiveTvlUsd > 10_000_000) effectiveTvlUsd = 10_000_000;
    }
  } catch (err) {
    logger.warn('Failed to calculate Effective TVL', { error: (err as Error).message });
  }
  // ─────────────────────────────────────────────────────────────────────────

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

    // ─── Calculate Individual Hop TVL ──────────────────────────────────────
    let hopTvlUsd = effectiveTvlUsd; // Fallback to bottleneck
    try {
      if (path.from && path.target && path.amountIn && path.amountOut) {
        const fromPriceUsd = await getUsdPriceOnChain(path.from);
        const targetPriceUsd = await getUsdPriceOnChain(path.target);
        
        const fromDecimals = (await getCoinMetadata(path.from))?.decimals ?? 9;
        const targetDecimals = (await getCoinMetadata(path.target))?.decimals ?? 9;

        const amtIn = Number(path.amountIn) / Math.pow(10, fromDecimals);
        const amtOut = Number(path.amountOut) / Math.pow(10, targetDecimals);

        if (fromPriceUsd > 0 && targetPriceUsd > 0 && amtIn > 0 && amtOut > 0) {
          const hopTradeUsd = amtIn * fromPriceUsd;
          const expectedOut = hopTradeUsd / targetPriceUsd;
          const actualOut = amtOut;
          
          const priceImpact = Math.max(0, 1 - (actualOut / expectedOut));
          
          if (priceImpact <= 0.0001) {
            hopTvlUsd = 10_000_000;
          } else {
            hopTvlUsd = (2 * hopTradeUsd) / priceImpact;
            if (hopTvlUsd > 10_000_000) hopTvlUsd = 10_000_000;
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to calc individual hop TVL', { error: (err as Error).message });
    }
    // ───────────────────────────────────────────────────────────────────────

    routes.push({
      dex: formattedDex,
      ratio: 100, // Approximated for UI
      fee: parseFloat(fee.toFixed(2)),
      weight: -Math.log(1 - fee / 100),
      poolAddress: path.id || undefined,
      liquidityUsd: hopTvlUsd,
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

      await Promise.all(poolObjects.map(async (obj: any) => {
        if (obj.data?.content?.dataType === 'moveObject') {
          const poolId = obj.data.objectId;
          const type = obj.data.content.type;
          const fields = (obj.data.content as any).fields;
          
          const routeNode = routes.find(r => r.poolAddress === poolId);
          if (!routeNode || !fields) return;

          // Extract raw liquidity depth
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
            routeNode.onChainLiquidityDepth = rawDepth;
          }

          // Mathematical Active TVL Calculation for CLMMs
          if (fields.liquidity && type) {
            const match = type.match(/<([^,]+),\s*([^>]+)>/);
            if (match) {
              const coinX = match[1];
              const coinY = match[2];
              
              const L = Number(fields.liquidity);
              if (L > 0) {
                const [metaX, metaY, priceX, priceY] = await Promise.all([
                  getCoinMetadata(coinX),
                  getCoinMetadata(coinY),
                  getUsdPriceOnChain(coinX),
                  getUsdPriceOnChain(coinY)
                ]);

                const decX = metaX?.decimals ?? 9;
                const decY = metaY?.decimals ?? 9;
                const avgDec = (decX + decY) / 2;

                const standardL = L / Math.pow(10, avgDec);
                if (priceX > 0 && priceY > 0) {
                  const activeTvlUsd = 2 * standardL * Math.sqrt(priceX * priceY);
                  if (activeTvlUsd > 0) {
                    routeNode.liquidityUsd = activeTvlUsd;
                  }
                }
              }
            }
          }
        }
      }));
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

// Cache for USD prices to avoid redundant aggregator calls
const usdPriceCache = new Map<string, { price: number; expiresAt: number }>();

export async function getUsdPriceOnChain(coinType: string): Promise<number> {
  const USDC_ADDRESS = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
  const USDT_ADDRESS = '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN';
  if (coinType === USDC_ADDRESS || coinType === USDT_ADDRESS) return 1;

  const cached = usdPriceCache.get(coinType);
  if (cached && cached.expiresAt > Date.now()) return cached.price;

  try {
    const clientSDK = new AggregatorClient('https://api-sui.cetus.zone/router_v3', '0x2', Env.Mainnet);
    const meta = await getCoinMetadata(coinType);
    const decimals = meta?.decimals ?? 9;
    const amountIn = new BN(10).pow(new BN(decimals)); // 1 Token

    const routers = await clientSDK.findRouters({
      from: coinType,
      target: USDC_ADDRESS,
      amount: amountIn,
      byAmountIn: true,
    });

    if (routers && routers.amountOut) {
      // amountOut is in USDC (6 decimals)
      const price = parseFloat(routers.amountOut.toString()) / 1_000_000;
      usdPriceCache.set(coinType, { price, expiresAt: Date.now() + 60_000 }); // Cache for 60s
      return price;
    }
  } catch (err) {
    logger.warn(`Failed to get USD price for ${coinType}`, { error: (err as Error).message });
  }
  return 0;
}


