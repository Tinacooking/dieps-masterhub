/**
 * AuditTokenService — Audited Token Registry & Contract Validation
 *
 * Provides:
 * 1. A strict local whitelist of verified SUI Testnet token contracts
 * 2. On-chain metadata validation via SUI RPC
 * 3. GoPlus SUI Token Security API scanning
 */

import dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface VerifiedToken {
  symbol: string;
  coinType: string;
  decimals: number;
  name: string;
  verified: boolean;
}

export interface AuditResult {
  coinType: string;
  onChainValid: boolean;
  goPlusClean: boolean;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Hardcoded whitelist — verified Sui Testnet coin types
// ---------------------------------------------------------------------------
const TOKEN_WHITELIST: Record<string, VerifiedToken> = {
  SUI: {
    symbol: 'SUI',
    coinType: '0x2::sui::SUI',
    decimals: 9,
    name: 'Sui',
    verified: true,
  },
  USDC: {
    symbol: 'USDC',
    coinType:
      '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
    decimals: 6,
    name: 'USD Coin',
    verified: true,
  },
  USDT: {
    symbol: 'USDT',
    coinType:
      '0xfb0e3eb97dd158a5ae979dddfa24348063843c5d55f2a0e7c55e5a29cee61b88::usdt::USDT',
    decimals: 6,
    name: 'Tether USD',
    verified: true,
  },
  CETUS: {
    symbol: 'CETUS',
    coinType:
      '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    decimals: 9,
    name: 'Cetus Protocol',
    verified: true,
  },
  DEEP: {
    symbol: 'DEEP',
    coinType:
      '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
    decimals: 6,
    name: 'DeepBook Token',
    verified: true,
  },
  NAVX: {
    symbol: 'NAVX',
    coinType:
      '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX',
    decimals: 9,
    name: 'NAVI Protocol',
    verified: true,
  },
  TURBOS: {
    symbol: 'TURBOS',
    coinType:
      '0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS',
    decimals: 9,
    name: 'Turbos Finance',
    verified: true,
  },
  MMT: {
    symbol: 'MMT',
    coinType:
      '0x8c9ce3e281b08a8ee793a9a32c2b6a30b2e478e3cee7dac9a1addf7bb8e47bfb::mmt::MMT',
    decimals: 9,
    name: 'Momentum Token',
    verified: true,
  },
};

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------
export class AuditTokenService {
  private suiRpcUrl: string;
  private goPlusUrl: string;

  constructor() {
    this.suiRpcUrl =
      process.env.SUI_TESTNET_RPC || 'https://fullnode.testnet.sui.io:443';
    this.goPlusUrl =
      process.env.GOPLUS_API_URL || 'https://api.gopluslabs.io/api/v1';
  }

  // -----------------------------------------------------------------------
  // 1. Symbol → CoinType resolution from whitelist
  // -----------------------------------------------------------------------
  resolveSymbol(symbol: string): VerifiedToken | null {
    const key = symbol.toUpperCase().trim();
    return TOKEN_WHITELIST[key] ?? null;
  }

  getAllTokens(): VerifiedToken[] {
    return Object.values(TOKEN_WHITELIST);
  }

  // -----------------------------------------------------------------------
  // 2. On-chain metadata validation via SUI JSON-RPC
  // -----------------------------------------------------------------------
  async validateOnChain(coinType: string): Promise<{
    valid: boolean;
    name?: string;
    symbol?: string;
    decimals?: number;
    error?: string;
  }> {
    try {
      const res = await fetch(this.suiRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getCoinMetadata',
          params: [coinType],
        }),
      });
      const data = await res.json() as any;

      if (data.error) {
        return { valid: false, error: data.error.message };
      }
      if (!data.result) {
        return { valid: false, error: 'No metadata found on-chain' };
      }

      return {
        valid: true,
        name: data.result.name,
        symbol: data.result.symbol,
        decimals: data.result.decimals,
      };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }

  // -----------------------------------------------------------------------
  // 3. GoPlus SUI Token Security API scan
  //    Endpoint: GET /token_security/56/{coinType}
  //    Chain 56 = SUI on GoPlus
  // -----------------------------------------------------------------------
  async auditWithGoPlus(coinType: string): Promise<{
    clean: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    try {
      // GoPlus uses the full coin type address, URL-encoded
      const encoded = encodeURIComponent(coinType);
      const url = `${this.goPlusUrl}/token_security/56?contract_addresses=${encoded}`;
      const res = await fetch(url);
      const data = await res.json() as any;

      if (data.code !== 1 || !data.result) {
        // GoPlus may not have data for testnet tokens — treat as advisory
        warnings.push('GoPlus: No security data available for this token (testnet may not be indexed)');
        return { clean: true, warnings };
      }

      // GoPlus returns result keyed by address
      const tokenData = Object.values(data.result)[0] as any;
      if (!tokenData) {
        warnings.push('GoPlus: Token not found in security database');
        return { clean: true, warnings };
      }

      // Critical checks
      if (tokenData.is_honeypot === '1') {
        warnings.push('CRITICAL: Token flagged as HONEYPOT by GoPlus');
        return { clean: false, warnings };
      }
      if (tokenData.cannot_sell_all === '1' || tokenData.cannot_sell === '1') {
        warnings.push('CRITICAL: Token has cannot_sell restriction — funds may be locked');
        return { clean: false, warnings };
      }
      if (tokenData.is_blacklisted === '1') {
        warnings.push('CRITICAL: Token is blacklisted');
        return { clean: false, warnings };
      }

      // Advisory checks
      if (tokenData.is_mintable === '1') {
        warnings.push('Advisory: Token is mintable — supply inflation risk');
      }
      if (tokenData.owner_change_balance === '1') {
        warnings.push('Advisory: Token owner can change balances');
      }
      if (tokenData.hidden_owner === '1') {
        warnings.push('Advisory: Token has a hidden owner');
      }

      return { clean: true, warnings };
    } catch (err: any) {
      warnings.push(`GoPlus API error: ${err.message}`);
      // Don't block on GoPlus API errors — treat as advisory
      return { clean: true, warnings };
    }
  }

  // -----------------------------------------------------------------------
  // 4. Full audit pipeline: whitelist → on-chain → GoPlus
  // -----------------------------------------------------------------------
  async fullAudit(symbol: string): Promise<AuditResult> {
    const token = this.resolveSymbol(symbol);
    if (!token) {
      return {
        coinType: symbol,
        onChainValid: false,
        goPlusClean: false,
        warnings: [
          `Security Alert: The token "${symbol}" is not in the verified whitelist. Only audited SUI tokens are supported.`,
        ],
      };
    }

    // Validate on-chain metadata
    const onChain = await this.validateOnChain(token.coinType);

    // Run GoPlus audit
    const goPlus = await this.auditWithGoPlus(token.coinType);

    const allWarnings = [...(onChain.error ? [`On-chain: ${onChain.error}`] : []), ...goPlus.warnings];

    if (!goPlus.clean) {
      return {
        coinType: token.coinType,
        onChainValid: onChain.valid,
        goPlusClean: false,
        warnings: allWarnings,
      };
    }

    return {
      coinType: token.coinType,
      onChainValid: onChain.valid,
      goPlusClean: goPlus.clean,
      warnings: allWarnings,
    };
  }
}

export const auditTokenService = new AuditTokenService();
