/**
 * DIEPS Intent Engine — Token Resolver
 * Resolves token symbols/names to full on-chain addresses.
 *
 * Primary source: /src/cetus-tokens.json  (921 tokens, loaded once at startup)
 * Decimals override: TOKEN_WHITELIST in constant.ts (only for non-9-decimal tokens)
 */

import fs from 'fs';
import path from 'path';

import { TOKEN_WHITELIST } from '../../config/index.js';
import type { WhitelistToken } from '../../config/index.js';
import { getCoinMetadata } from '../../utils/suiClient.js';
import { logger } from '../../utils/logger.js';

// ─── Load cetus-tokens.json once at startup ───────────────────────────────────

interface CetusToken {
  symbol: string;
  name: string;
  coinType: string;
  logoUrl?: string;
  decimals?: number;
}

let _cetusRegistry: CetusToken[] = [];

function loadCetusRegistry(): CetusToken[] {
  if (_cetusRegistry.length > 0) return _cetusRegistry;
  try {
    const tokensPath = path.join(process.cwd(), 'src', 'cetus-tokens.json');
    if (fs.existsSync(tokensPath)) {
      _cetusRegistry = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
      logger.info(`Loaded cetus token registry: ${_cetusRegistry.length} tokens`);
    }
  } catch (e) {
    logger.error('Failed to load cetus-tokens.json', e);
  }
  return _cetusRegistry;
}

// Load immediately at module init
loadCetusRegistry();

// ─── Runtime cache for on-chain metadata (decimals fetch) ────────────────────

const metaCache = new Map<string, { decimals: number; expiresAt: number }>();
const META_CACHE_TTL = 600_000; // 10 min

async function getDecimalsForCoinType(coinType: string): Promise<number> {
  // 1. Check whitelist for override (USDC=6, USDT=6, WETH=8, WBTC=8 etc.)
  const override = TOKEN_WHITELIST.find(t => t.address === coinType);
  if (override) return override.decimals;

  // 2. Check runtime cache
  const cached = metaCache.get(coinType);
  if (cached && cached.expiresAt > Date.now()) return cached.decimals;

  // 3. Fetch on-chain
  try {
    const meta = await getCoinMetadata(coinType);
    const decimals = meta?.decimals ?? 9;
    metaCache.set(coinType, { decimals, expiresAt: Date.now() + META_CACHE_TTL });
    return decimals;
  } catch {
    return 9;
  }
}

// ─── Primary lookup from cetus-tokens.json ───────────────────────────────────

function findInRegistry(input: string): CetusToken | undefined {
  const registry = loadCetusRegistry();
  const upper = input.trim().toUpperCase();

  // Exact symbol match (fast path)
  const bySymbol = registry.find(t => t.symbol.toUpperCase() === upper);
  if (bySymbol) return bySymbol;

  // Coin type match (if caller passes a full type)
  if (input.includes('::')) {
    return registry.find(t => t.coinType === input.trim());
  }

  return undefined;
}

// ─── Public: resolveToken (whitelist entry, for backward compat) ──────────────

export function resolveToken(symbolOrName: string): WhitelistToken | null {
  const input = symbolOrName.trim().toUpperCase();

  // Direct symbol match in whitelist
  const bySymbol = TOKEN_WHITELIST.find(t => t.symbol === input);
  if (bySymbol) return bySymbol;

  // Alias match
  const lower = symbolOrName.trim().toLowerCase();
  const byAlias = TOKEN_WHITELIST.find(t =>
    t.aliases.some(a => a.toLowerCase() === lower)
  );
  if (byAlias) return byAlias;

  // Fuzzy map
  const fuzzyMap: Record<string, string> = {
    'ethereum': 'WETH', 'ether': 'WETH',
    'bitcoin': 'WBTC',
    'dollar': 'USDC', 'usd': 'USDC',
    'tether': 'USDT',
    'deepbook': 'DEEP',
    'scallop': 'SCA',
    'navi': 'NAVX',
    'bucket': 'BUCK',
    'walrus': 'WAL',
  };
  const fuzzyResult = fuzzyMap[lower];
  if (fuzzyResult) {
    return TOKEN_WHITELIST.find(t => t.symbol === fuzzyResult) || null;
  }

  return null;
}

// ─── Public: resolveTokenAddress ─────────────────────────────────────────────

export async function resolveTokenAddress(symbol: string): Promise<string> {
  // 1. Whitelist override (for aliases and fuzzy)
  const whitelisted = resolveToken(symbol);
  if (whitelisted) return whitelisted.address;

  // 2. cetus-tokens.json registry (primary)
  const inRegistry = findInRegistry(symbol);
  if (inRegistry) return inRegistry.coinType;

  // 3. If it already looks like a coin type, verify on-chain
  if (symbol.includes('::')) {
    try {
      const meta = await getCoinMetadata(symbol);
      if (meta) {
        logger.info(`On-chain verified raw coin type: ${symbol}`);
        return symbol;
      }
    } catch {
      logger.warn(`Could not verify coin type on-chain: ${symbol}`);
    }
  }

  // 4. Fall back to original symbol (caller handles failure)
  return symbol;
}

// ─── Public: resolveTokenDynamic (legacy async, kept for compat) ─────────────

export async function resolveTokenDynamic(symbolOrAddress: string): Promise<string | null> {
  const address = await resolveTokenAddress(symbolOrAddress);
  return address !== symbolOrAddress ? address : null;
}

// ─── Public: getTokenDecimals ─────────────────────────────────────────────────

export function getTokenDecimals(symbol: string): number {
  // 1. Whitelist has exact decimals (USDC=6, USDT=6, WETH=8, etc.)
  const whitelisted = resolveToken(symbol);
  if (whitelisted) return whitelisted.decimals;

  // 2. Registry token — decimals field may be present (future-proof)
  const inRegistry = findInRegistry(symbol);
  if (inRegistry?.decimals !== undefined) return inRegistry.decimals;

  // 3. Default to 9 (most Sui tokens)
  // The caller (cetusRouter) will get accurate decimals asynchronously via
  // getDecimalsForCoinType() if needed — but for the synchronous path, 9 is
  // correct for SUI, WAL, CETUS, NAVX, SCA, TURBOS, BUCK, and most others.
  return 9;
}

/**
 * Async version of getTokenDecimals — fetches on-chain if needed.
 * Use this when accuracy is critical (e.g. PTB amount calculation).
 */
export async function getTokenDecimalsAsync(symbol: string): Promise<number> {
  const whitelisted = resolveToken(symbol);
  if (whitelisted) return whitelisted.decimals;

  const inRegistry = findInRegistry(symbol);
  if (inRegistry) {
    if (inRegistry.decimals !== undefined) return inRegistry.decimals;
    return getDecimalsForCoinType(inRegistry.coinType);
  }

  if (symbol.includes('::')) {
    return getDecimalsForCoinType(symbol);
  }

  return 9;
}

// ─── Public: utility helpers ─────────────────────────────────────────────────

export function isWhitelistedToken(symbol: string): boolean {
  return resolveToken(symbol) !== null;
}

export function isStablePair(sourceSymbol: string, destSymbol: string): boolean {
  const source = resolveToken(sourceSymbol);
  const dest = resolveToken(destSymbol);
  return (source?.isStable && dest?.isStable) || false;
}

export function getAllWhitelistedTokens(): WhitelistToken[] {
  return [...TOKEN_WHITELIST];
}

/**
 * Return all tokens from the full Cetus registry (for autocomplete / UI).
 */
export function getAllRegistryTokens(): CetusToken[] {
  return loadCetusRegistry();
}
