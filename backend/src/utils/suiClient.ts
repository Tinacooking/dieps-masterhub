/**
 * DIEPS Intent Engine — Sui RPC Client
 * Singleton JSON-RPC client for Sui Mainnet with retry logic.
 * Uses raw fetch for maximum compatibility with Cetus Aggregator SDK.
 */

import { SUI_MAINNET_RPC, SUI_API_KEY } from '../config/index.js';
import { logger } from './logger.js';
import { SuiGraphQLClient } from '@mysten/sui/graphql';

const gqlClient = new SuiGraphQLClient({
  network: 'mainnet',
  url: 'https://graphql.mainnet.sui.io/graphql',
});

/** JSON-RPC request ID counter */
let rpcIdCounter = 1;

/** Build standard headers for Sui RPC calls */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (SUI_API_KEY) {
    headers['x-api-key'] = SUI_API_KEY;
    headers['Authorization'] = `Bearer ${SUI_API_KEY}`;
  }
  return headers;
}

/**
 * Execute a JSON-RPC call to the Sui fullnode.
 * Includes retry logic for transient failures.
 */
export async function suiRpcCall(
  method: string,
  params: any[] = [],
  retries = 2
): Promise<any> {
  const id = rpcIdCounter++;
  const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(SUI_MAINNET_RPC, {
        method: 'POST',
        headers: buildHeaders(),
        body,
      });

      if (!res.ok) {
        throw new Error(`RPC HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        logger.warn(`RPC error on ${method}`, { error: data.error });
        throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      return data.result;
    } catch (err: any) {
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500;
        logger.warn(`RPC call ${method} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms`, {
          error: err.message,
        });
        await new Promise(r => setTimeout(r, delay));
      } else {
        logger.error(`RPC call ${method} failed after ${retries + 1} attempts`, { error: err.message });
        throw err;
      }
    }
  }
}

/**
 * Proxy a raw JSON-RPC request body to the Sui fullnode.
 * Used by the /api/sui-rpc endpoint to keep API keys server-side.
 */
export async function suiRpcProxy(body: any): Promise<any> {
  const res = await fetch(SUI_MAINNET_RPC, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Get the reference gas price from the network.
 */
export async function getReferenceGasPrice(): Promise<string> {
  return suiRpcCall('suix_getReferenceGasPrice');
}

/**
 * Get balance for a specific coin type.
 */
export async function getBalance(owner: string, coinType: string): Promise<{
  totalBalance: string;
  coinObjectCount: number;
}> {
  const result = await suiRpcCall('suix_getBalance', [owner, coinType]);
  return {
    totalBalance: result.totalBalance || '0',
    coinObjectCount: result.coinObjectCount || 0,
  };
}

/**
 * Get all coins of a specific type owned by an address.
 * Paginates automatically to collect all coins.
 */
export async function getAllCoins(
  owner: string,
  coinType: string,
  limit = 50
): Promise<Array<{
  coinObjectId: string;
  version: string;
  digest: string;
  balance: string;
  coinType: string;
}>> {
  const allCoins: any[] = [];
  let cursor: string | null = null;

  do {
    const params: any[] = [owner, coinType, cursor, limit];
    const result = await suiRpcCall('suix_getCoins', params);

    if (result.data) {
      allCoins.push(...result.data);
    }

    cursor = result.nextCursor || null;
    // Stop if there are no more pages
    if (!result.hasNextPage) break;
  } while (cursor);

  return allCoins.map((c: any) => ({
    coinObjectId: c.coinObjectId,
    version: c.version,
    digest: c.digest,
    balance: c.balance,
    coinType: c.coinType,
  }));
}

/**
 * Get coin metadata (symbol, decimals, etc.)
 */
export async function getCoinMetadata(coinType: string): Promise<{
  decimals: number;
  symbol: string;
  name: string;
} | null> {
  try {
    const query = `
      query getMeta($coinType: String!) {
        coinMetadata(coinType: $coinType) {
          decimals
          symbol
          name
        }
      }
    `;
    const result = await gqlClient.query({
      query,
      variables: { coinType },
    });

    const meta = result.data?.coinMetadata;
    if (!meta) return null;
    
    return {
      decimals: meta.decimals ?? 9,
      symbol: meta.symbol ?? '',
      name: meta.name ?? '',
    };
  } catch (err) {
    logger.warn(`GraphQL getCoinMetadata failed for ${coinType}`, { error: (err as Error).message });
    return null;
  }
}

/**
 * Get object data by ID
 */
export async function getObject(objectId: string): Promise<any> {
  return suiRpcCall('sui_getObject', [objectId, {
    showContent: true,
    showOwner: true,
    showType: true,
  }]);
}

/** Export the RPC endpoint for external use */
export { SUI_MAINNET_RPC };
