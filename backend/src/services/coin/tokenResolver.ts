/**
 * DIEPS Intent Engine — Token Resolver
 * Resolves token symbols/names to full on-chain addresses.
 * Uses static whitelist and on-chain metadata resolution.
 */

import { TOKEN_WHITELIST } from '../../config/index.js';
import type { WhitelistToken } from '../../config/index.js';
import { getCoinMetadata } from '../../utils/suiClient.js';
import { logger } from '../../utils/logger.js';

/** In-memory cache for dynamically resolved tokens */
const dynamicCache = new Map<string, { address: string; symbol: string; decimals: number; expiresAt: number }>();
const CACHE_TTL_MS = 300_000; // 5 minute cache for dynamic lookups

/**
 * Resolve a token symbol or name to its whitelist entry.
 * Returns null if not found in whitelist (caller should try dynamic resolution).
 */
export function resolveToken(symbolOrName: string): WhitelistToken | null {
  const input = symbolOrName.trim().toUpperCase();

  // Direct symbol match
  const bySymbol = TOKEN_WHITELIST.find(t => t.symbol === input);
  if (bySymbol) return bySymbol;

  // Alias match (case-insensitive)
  const lower = symbolOrName.trim().toLowerCase();
  const byAlias = TOKEN_WHITELIST.find(t =>
    t.aliases.some(a => a.toLowerCase() === lower)
  );
  if (byAlias) return byAlias;

  // Fuzzy match — handle common variations
  const fuzzyMap: Record<string, string> = {
    'ethereum': 'WETH',
    'ether': 'WETH',
    'bitcoin': 'WBTC',
    'dollar': 'USDC',
    'usd': 'USDC',
    'tether': 'USDT',
    'deepbook': 'DEEP',
    'scallop': 'SCA',
    'navi': 'NAVX',
    'bucket': 'BUCK',
  };

  const fuzzyResult = fuzzyMap[lower];
  if (fuzzyResult) {
    return TOKEN_WHITELIST.find(t => t.symbol === fuzzyResult) || null;
  }

  return null;
}

/**
 * Resolve a token address dynamically via Sui RPC.
 * Called when the token is not in the whitelist. 
 * User must provide a valid CoinType (e.g. 0x...::name::NAME).
 */
export async function resolveTokenDynamic(symbolOrAddress: string): Promise<string | null> {
  const input = symbolOrAddress.trim();

  // Check dynamic cache first
  const cached = dynamicCache.get(input);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.address;
  }

  // Special case: SUI is always known
  if (input.toUpperCase() === 'SUI') return '0x2::sui::SUI';

  // Check whitelist first
  const whitelisted = resolveToken(input);
  if (whitelisted) return whitelisted.address;

  // If it's not in whitelist, we assume it's a raw coin type if it has ::
  if (input.includes('::')) {
    try {
      // Verify via RPC
      const metadata = await getCoinMetadata(input);
      if (metadata) {
        // Cache the result
        dynamicCache.set(input, {
          address: input,
          symbol: metadata.symbol || input.split('::').pop() || input,
          decimals: metadata.decimals || 9,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });

        logger.info(`Dynamically verified on-chain token: ${input}`);
        return input;
      }
    } catch (err: any) {
      logger.warn(`Failed to verify token on-chain: ${input}`, { error: err.message });
    }
  }

  return null;
}

/**
 * Resolve a token symbol to its address, trying whitelist then dynamic.
 * Returns the address string, or the original symbol if resolution fails.
 */
export async function resolveTokenAddress(symbol: string): Promise<string> {
  // Whitelist first
  const whitelisted = resolveToken(symbol);
  if (whitelisted) return whitelisted.address;

  // Dynamic resolution
  const dynamic = await resolveTokenDynamic(symbol);
  if (dynamic) return dynamic;

  // Return symbol as-is (may be an address already)
  return symbol;
}

/**
 * Get token decimals for a symbol.
 */
export function getTokenDecimals(symbol: string): number {
  const token = resolveToken(symbol);
  return token?.decimals ?? 9;
}

/**
 * Check if a token is in the whitelist.
 */
export function isWhitelistedToken(symbol: string): boolean {
  return resolveToken(symbol) !== null;
}

/**
 * Check if a pair is a stablecoin pair.
 */
export function isStablePair(sourceSymbol: string, destSymbol: string): boolean {
  const source = resolveToken(sourceSymbol);
  const dest = resolveToken(destSymbol);
  return (source?.isStable && dest?.isStable) || false;
}

/**
 * Get all whitelisted tokens.
 */
export function getAllWhitelistedTokens(): WhitelistToken[] {
  return [...TOKEN_WHITELIST];
}
