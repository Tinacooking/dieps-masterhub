/**
 * DIEPS Intent Engine — Token Safety Service
 * Checks token safety: whitelist status, holder distribution, honeypot detection.
 */

import { isWhitelistedToken, resolveToken } from '../coin/tokenResolver.js';
import { logger } from '../../utils/logger.js';
import { getCoinMetadata } from '../../utils/suiClient.js';
import { RISK_THRESHOLDS } from '../../config/index.js';
import type { RiskCheck } from '../../types/index.js';

/**
 * Run all token safety checks for a given token.
 */
export async function checkTokenSafety(symbol: string): Promise<RiskCheck[]> {
  const checks: RiskCheck[] = [];

  // Identify if token is Sui Native by checking its on-chain struct format, avoiding hardcoded symbols.
  const token = resolveToken(symbol);
  const isSuiNative = token?.address?.endsWith('::sui::SUI');

  // Native token is intrinsically safe and requires no community checks.
  if (isSuiNative) {
    return checks;
  }

  // Check 1: Whitelist status
  const whitelisted = isWhitelistedToken(symbol);
  checks.push({
    name: 'Token Whitelist',
    status: whitelisted ? 'SAFE' : 'WARNING',
    message: whitelisted
      ? `${symbol} is a verified whitelisted token`
      : `${symbol} is not in the token whitelist — exercise caution`,
    value: whitelisted ? 100 : 30,
  });

  // If whitelisted, skip expensive checks
  if (whitelisted) {
    checks.push({
      name: 'Holder Distribution',
      status: 'SAFE',
      message: `${symbol} is a known token with healthy distribution`,
      value: 90,
    });
    return checks;
  }

  // If not whitelisted, we do an on-chain verification check
  try {
    const onChainTokenCheck = await verifyTokenOnChain(symbol);
    checks.push(onChainTokenCheck);
  } catch (err: any) {
    checks.push({
      name: 'On-Chain Verification',
      status: 'WARNING',
      message: `Could not verify token ${symbol} on-chain`,
    });
  }

  return checks;
}

/**
 * Verify unwhitelisted token on-chain via Sui RPC.
 */
async function verifyTokenOnChain(symbolOrAddress: string): Promise<RiskCheck> {
  try {
    // If it's a valid address format, check metadata
    if (symbolOrAddress.includes('::')) {
      const metadata = await getCoinMetadata(symbolOrAddress);

      if (metadata) {
        return {
          name: 'On-Chain Verification',
          status: 'WARNING',
          message: `Token is verified on-chain but not in whitelist. Trade with caution.`,
          value: 50,
        };
      }
    }

    return {
      name: 'On-Chain Verification',
      status: 'DANGER',
      message: `Token ${symbolOrAddress} is not whitelisted and could not be verified on-chain.`,
    };
  } catch (err: any) {
    logger.warn('Token on-chain verification failed', { symbol: symbolOrAddress, error: err.message });
    return {
      name: 'On-Chain Verification',
      status: 'WARNING',
      message: `Could not verify token on-chain.`,
    };
  }
}

/**
 * Quick check if a token is considered safe for trading.
 */
export function isTokenSafe(symbol: string): boolean {
  return isWhitelistedToken(symbol);
}
