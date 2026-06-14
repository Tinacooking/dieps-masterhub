/**
 * DIEPS Intent Engine — Configuration
 * All constants, endpoints, thresholds, and token whitelist for Sui Mainnet.
 */

import dotenv from 'dotenv';
dotenv.config();

// ─── Network Configuration ────────────────────────────────────

export const SUI_MAINNET_RPC = process.env.SUI_RPC_ENDPOINT || 'https://fullnode.mainnet.sui.io:443';
export const SUI_MAINNET_GRAPHQL = 'https://graphql.mainnet.sui.io/graphql';
export const SUI_API_KEY = process.env.SUI_API_KEY || '';

// ─── Cetus Aggregator V3 ──────────────────────────────────────

export const CETUS_AGGREGATOR_V3_URL = 'https://api-sui.cetus.zone/router_v2/find_routes';
export const CETUS_SUPPORTED_DEXES = [
  'cetus', 'deepbook', 'kriya', 'flowx', 'aftermath', 'turbos', 'bluefin',
];

// ─── LLM Configuration (OpenRouter) ───────────────────────────

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';


// ─── Risk Thresholds ───────────────────────────────────────────

export const RISK_THRESHOLDS = {
  /** Price impact thresholds (%) */
  priceImpact: {
    warn: 1.0,
    recommendSplit: 3.0,
    reject: 5.0,
  },
  /** Minimum pool liquidity in USD */
  minLiquidity: {
    stablePair: 50_000,
    volatilePair: 10_000,
  },

  /** Pool age minimum (days) */
  poolMinAge: 7,
  /** Top holder concentration threshold (%) */
  holderConcentration: {
    warn: 50,
    reject: 80,
  },
};

export * from './constant.js';

// ─── Rate Limiting ─────────────────────────────────────────────

export const RATE_LIMIT = {
  windowMs: 60_000,       // 1 minute window
  maxRequests: 60,        // max 60 requests per window per IP
};

// ─── Server Configuration ──────────────────────────────────────

export const SERVER_PORT = parseInt(process.env.PORT || '3000', 10);
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const NODE_ENV = process.env.NODE_ENV || 'development';


