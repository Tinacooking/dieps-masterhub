export interface TokenInfo {
  symbol: string;
  name: string;
  coinType: string;
  logoUrl?: string;
}

import cetusTokens from './cetus-tokens.json';

const POPULAR_SYMBOLS = [
  'SUI', 'USDC', 'USDT', 'WBTC', 'WETH', 'BUCK', 'FUD', 'SCA', 
  'CETUS', 'TURBOS', 'DEEP', 'NAVX', 'HASUI', 'AFSUI', 'BLUB', 
  'NS', 'SEND', 'SUIA', 'KRIYA', 'LIQ'
];

export const TOKENS = POPULAR_SYMBOLS.map(symbol => {
  const found = cetusTokens.find((t: any) => t.symbol.toUpperCase() === symbol);
  if (found) {
    return {
      symbol: found.symbol,
      name: found.name,
      coinType: found.coinType,
      logoUrl: found.logoUrl || undefined,
    };
  }
  return null;
}).filter(Boolean) as TokenInfo[];

export function getTokenInfo(symbol: string): TokenInfo | undefined {
  const found = cetusTokens.find((t: any) => t.symbol.toUpperCase() === symbol.toUpperCase());
  if (found) {
    return {
      symbol: found.symbol,
      name: found.name,
      coinType: found.coinType,
      logoUrl: found.logoUrl || undefined,
    };
  }
  return undefined;
}
