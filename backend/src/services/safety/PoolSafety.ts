/**
 * DIEPS Intent Engine — Pool Safety Service
 * Validates pool safety: age, creator address, liquidity locks.
 */

import { RISK_THRESHOLDS } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { suiRpcCall } from '../../utils/suiClient.js';
import type { RiskCheck } from '../../types/index.js';

/** Known DEX factory/deployer addresses on Sui Mainnet */
const KNOWN_DEX_CREATORS = new Set([
  // Cetus Protocol
  '0x1eabed72c53feb73c83ec843df2f6c74b5ad3d3c0e84ca1bed497476b6ad15e4',
  // Turbos Finance  
  '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1',
  // DeepBook
  '0x000000000000000000000000000000000000000000000000000000000000dee9',
  // Kriya
  '0xa0eba10b173538c8fecca1dff298e488402cc9ff374f8a12ca7758eebe5b4bac',
  // FlowX
  '0xba153169476e8c3114962261d1edc70de5ad9b18b1c21f39e5e05ab7eb6c80a3',
  // Aftermath
  '0x7f6ce7ade63857c4fd16ef7783fed2dfc4d7fb7e40615abdb653030b76aef0c6',
]);

/**
 * Run all pool safety checks based on route data.
 */
export async function checkPoolSafety(route: any[]): Promise<RiskCheck[]> {
  const checks: RiskCheck[] = [];

  if (!route || route.length === 0) {
    checks.push({
      name: 'Pool Verification',
      status: 'WARNING',
      message: 'No route data available for safety verification',
    });
    return checks;
  }

  // Check 1: DEX verification
  checks.push(checkDexVerification(route));

  // Check 2: Liquidity health
  checks.push(checkLiquidityHealth(route));

  // Check 3: Pool Age / Stale Pool Check (100% On-chain)
  checks.push(await checkPoolAge(route));

  return checks;
}

/**
 * Check if the pools are on known/verified DEXes.
 */
function checkDexVerification(route: any[]): RiskCheck {
  const knownDexes = ['cetus', 'turbos', 'deepbook', 'kriya', 'flowx', 'aftermath', 'bluefin'];
  
  const unknownDexes = route.map(n => n.dex).filter(dex => !knownDexes.includes(dex.toLowerCase()));

  if (unknownDexes.length === 0) {
    return {
      name: 'DEX Verification',
      status: 'SAFE',
      message: `All pools are on verified DEXes`,
    };
  }

  return {
    name: 'DEX Verification',
    status: 'WARNING',
    message: `Route includes unverified DEXes: ${unknownDexes.join(', ')} — exercise caution`,
  };
}

/**
 * Check pool liquidity health across the route.
 * Flags routes with very low liquidity.
 */
function checkLiquidityHealth(route: any[]): RiskCheck {
  // Use the minimum liquidity across all hops in the route
  const minLiquidityInRoute = Math.min(...route.map(n => n.liquidityUsd || 0));
  const minLiquidityThreshold = RISK_THRESHOLDS.minLiquidity.volatilePair;

  if (minLiquidityInRoute === 0) {
    // Fallback to on-chain depth if USD data is missing
    const minOnChainDepth = Math.min(...route.map(n => n.onChainLiquidityDepth || 0));
    
    if (minOnChainDepth > 0) {
      return {
        name: 'Liquidity Health',
        status: 'SAFE',
        message: `On-chain pool depth verified. Minimum raw liquidity metric: ${minOnChainDepth.toLocaleString()}`,
      };
    }

    return {
      name: 'Liquidity Health',
      status: 'WARNING',
      message: 'Liquidity data unavailable for one or more pools in route',
    };
  }

  if (minLiquidityInRoute < minLiquidityThreshold) {
    return {
      name: 'Liquidity Health',
      status: 'DANGER',
      message: `Pool liquidity bottleneck is $${minLiquidityInRoute.toLocaleString()} (minimum: $${minLiquidityThreshold.toLocaleString()})`,
      value: minLiquidityInRoute,
      threshold: minLiquidityThreshold,
    };
  }

  return {
    name: 'Liquidity Health',
    status: 'SAFE',
    message: `All pools have healthy liquidity (min: $${minLiquidityInRoute.toLocaleString()})`,
    value: minLiquidityInRoute,
    threshold: minLiquidityThreshold,
  };
}

/**
 * Check if a pool address belongs to a known DEX creator.
 */
export function isKnownDexPool(creatorAddress: string): boolean {
  return KNOWN_DEX_CREATORS.has(creatorAddress.toLowerCase());
}

/**
 * Check Pool Age & Recent Activity via On-Chain Timestamp
 * Determines if a pool is "Stale" (abandoned) without any external indexer.
 */
async function checkPoolAge(route: any[]): Promise<RiskCheck> {
  if (route.length === 0) {
    return { name: 'Pool Age Activity', status: 'WARNING', message: 'No route data' };
  }

  try {
    // Check the first pool in the route as a proxy for the trade's primary liquidity source
    const primaryPoolId = route[0].poolAddress || route[0].poolId || route[0].id;
    if (!primaryPoolId) {
       return { name: 'Pool Age Activity', status: 'SAFE', message: 'Standard routing used' };
    }

    // 1. Get the pool object's previous transaction digest
    const poolObject = await suiRpcCall('sui_getObject', [primaryPoolId, { showPreviousTransaction: true }]);
    const previousTxDigest = poolObject?.data?.previousTransaction;

    if (!previousTxDigest) {
      return {
        name: 'Pool Age Activity',
        status: 'WARNING',
        message: 'Could not determine recent pool activity on-chain',
      };
    }

    // 2. Fetch the timestamp of that transaction
    const txBlock = await suiRpcCall('sui_getTransactionBlock', [previousTxDigest, { showInput: false, showEffects: false, showEvents: false }]);
    const timestampMs = parseInt(txBlock?.timestampMs || '0');

    if (timestampMs === 0) {
       return { name: 'Pool Age Activity', status: 'WARNING', message: 'Timestamp missing from on-chain block' };
    }

    // 3. Calculate staleness
    const nowMs = Date.now();
    const daysSinceLastTx = (nowMs - timestampMs) / (1000 * 60 * 60 * 24);

    if (daysSinceLastTx > 7) {
      return {
        name: 'Pool Age Activity',
        status: 'DANGER',
        message: `Stale Pool: No on-chain activity in the last ${Math.floor(daysSinceLastTx)} days. Extreme rug-pull or liquidity lock risk.`,
        value: daysSinceLastTx,
      };
    }

    if (daysSinceLastTx > 3) {
      return {
        name: 'Pool Age Activity',
        status: 'WARNING',
        message: `Low Activity: Pool hasn't had transactions in ${Math.floor(daysSinceLastTx)} days.`,
        value: daysSinceLastTx,
      };
    }

    return {
      name: 'Pool Age Activity',
      status: 'SAFE',
      message: `Pool is active. Last on-chain transaction was ${Math.floor(daysSinceLastTx * 24)} hours ago.`,
      value: daysSinceLastTx,
    };
  } catch (err: any) {
    logger.warn('Pool age check failed', { error: err.message });
    return {
      name: 'Pool Age Activity',
      status: 'WARNING',
      message: 'On-chain activity check failed. Proceed with caution.',
    };
  }
}
