import { describe, it, expect, vi } from 'vitest';
import { getRealTokenPrice, resolveTokenAddress, generateMockPool } from '../server.js';

describe('Routing Engine Utility Functions', () => {
  it('should resolve token addresses correctly from local registry', async () => {
    const addressSui = await resolveTokenAddress('SUI');
    expect(addressSui).toBe('0x2::sui::SUI');
    
    const addressFud = await resolveTokenAddress('FUD');
    expect(addressFud).toContain('0x76c659d334e2daf144e183a040d2ba510dbef29945a51a902cb3c40a322def102');
  });

  it('should return null for unknown tokens not in registry', async () => {
    const addressUnknown = await resolveTokenAddress('UNKNOWN_TOKEN_ABC');
    expect(addressUnknown).toBeNull();
  });

  it('should return the original address if an address is provided', async () => {
    const testAddress = '0x123::test::TEST';
    const result = await resolveTokenAddress(testAddress);
    expect(result).toBe(testAddress);
  });

  it('should get hardcoded real prices for tokens', async () => {
    const priceSui = await getRealTokenPrice('SUI');
    expect(priceSui).toBe(0.74);
    
    const priceCetus = await getRealTokenPrice('CETUS');
    expect(priceCetus).toBe(0.018);
    
    const priceUnknown = await getRealTokenPrice('XYZ');
    expect(priceUnknown).toBe(1.0);
  });

  it('should generate a mock pool with correct properties', async () => {
    const pool = await generateMockPool('SCA');
    expect(pool).toBeDefined();
    expect(pool?.dex).toBe('mock_dex');
    expect(pool?.baseToken.symbol).toBe('SCA');
    expect(pool?.priceUsd).toBe('0.2');
    expect(pool?.fee_percentage).toBe(0.003);
  });
});
