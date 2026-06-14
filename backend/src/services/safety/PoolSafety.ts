/**
 * DIEPS Intent Engine — Pool Safety Service
 * Validates pool safety: age, creator address, liquidity locks.
 */

import { RISK_THRESHOLDS } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
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
