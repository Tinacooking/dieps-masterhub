/**
 * manage_pools.ts — Pool ID Filtering & Discovery Script
 *
 * Usage: npx tsx scripts/manage_pools.ts
 *
 * 1. Reads pool_related_ids.txt
 * 2. Validates pool objects on SUI Testnet RPC
 * 3. Filters by 6 target DEX packages (Aftermath, Cetus, Navi, Turbos, Deepbook, Momentum)
 * 4. Removes invalid/non-target pools
 * 5. Writes cleaned pool list back
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const SUI_RPC = process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443';
const POOL_FILE = resolve(process.cwd(), 'pool_related_ids.txt');

// Target DEX package prefixes on SUI Testnet
const TARGET_DEX_PACKAGES: Record<string, string[]> = {
  aftermath: ['0x0625e58f', '0xefe170ec'],
  cetus: ['0x1eabed72', '0x714a63a0', '0xa7239a0c'],
  navi: ['0xa3eae045', '0xf6c05e2d'],
  turbos: ['0x91bfbc38', '0x9032f8ae'],
  deepbook: ['0x00000000'],
  momentum: ['0x8c9ce3e2'],
};

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  DIEPS Pool Manager — SUI Testnet');
  console.log('═══════════════════════════════════════════\n');

  // 1. Read pool IDs
  let poolIds: string[];
  try {
    const content = readFileSync(POOL_FILE, 'utf-8');
    poolIds = content.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('0x'));
    console.log(`📖 Read ${poolIds.length} pool IDs from pool_related_ids.txt`);
  } catch (err) {
    console.error('❌ Failed to read pool_related_ids.txt:', err);
    process.exit(1);
  }

  // 2. Validate pools in batches
  const BATCH_SIZE = 50;
  const validPools: Array<{ id: string; dex: string; type: string; coinA: string; coinB: string }> = [];
  const invalidIds: string[] = [];
  let processedCount = 0;

  // Only process first 2000 for speed in testnet
  const maxProcess = Math.min(poolIds.length, 2000);

  for (let i = 0; i < maxProcess; i += BATCH_SIZE) {
    const batch = poolIds.slice(i, i + BATCH_SIZE);
    processedCount += batch.length;

    try {
      const res = await fetch(SUI_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_multiGetObjects',
          params: [batch, { showContent: true, showType: true }],
        }),
      });
      const data = (await res.json()) as any;

      if (data.result) {
        for (let j = 0; j < data.result.length; j++) {
          const obj = data.result[j];
          const poolId = batch[j];

          if (!obj?.data?.type) {
            invalidIds.push(poolId);
            continue;
          }

          const typeStr: string = obj.data.type;
          const pkgMatch = typeStr.match(/^(0x[0-9a-fA-F]+)::/);
          if (!pkgMatch) {
            invalidIds.push(poolId);
            continue;
          }

          const pkgPrefix = pkgMatch[1].substring(0, 10);
          let dexName = 'unknown';

          for (const [name, prefixes] of Object.entries(TARGET_DEX_PACKAGES)) {
            if (prefixes.some((p) => pkgPrefix.startsWith(p))) {
              dexName = name;
              break;
            }
          }

          // Extract coin types
          const typeParamsMatch = typeStr.match(/<(.+)>/);
          let coinA = '', coinB = '';
          if (typeParamsMatch) {
            const params = typeParamsMatch[1].split(',').map((t: string) => t.trim());
            if (params.length >= 2) {
              coinA = params[0];
              coinB = params[1];
            }
          }

          if (dexName !== 'unknown') {
            validPools.push({ id: poolId, dex: dexName, type: typeStr, coinA, coinB });
          } else {
            invalidIds.push(poolId);
          }
        }
      }
    } catch (err) {
      console.error(`  ⚠️ Batch error at offset ${i}:`, err);
    }

    // Progress update
    if (processedCount % 200 === 0 || processedCount >= maxProcess) {
      console.log(`  📊 Processed ${processedCount}/${maxProcess} pools...`);
    }
  }

  // 3. Summary
  console.log('\n══════════ RESULTS ══════════');
  console.log(`✅ Valid target DEX pools: ${validPools.length}`);
  console.log(`❌ Invalid/non-target pools: ${invalidIds.length}`);
  console.log(`⏭️ Unprocessed (beyond limit): ${poolIds.length - maxProcess}`);

  // DEX breakdown
  const dexCounts: Record<string, number> = {};
  for (const p of validPools) {
    dexCounts[p.dex] = (dexCounts[p.dex] || 0) + 1;
  }
  console.log('\n📊 DEX Breakdown:');
  for (const [dex, count] of Object.entries(dexCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${dex.padEnd(12)} ${count} pools`);
  }

  // 4. Write cleaned pool list (valid pools first, then remaining unprocessed)
  const cleanedIds = [
    ...validPools.map((p) => p.id),
    ...poolIds.slice(maxProcess), // Keep unprocessed IDs
  ];

  writeFileSync(POOL_FILE, cleanedIds.join('\n') + '\n', 'utf-8');
  console.log(`\n💾 Wrote ${cleanedIds.length} pool IDs back to pool_related_ids.txt`);

  // 5. Show sample pools
  console.log('\n📋 Sample valid pools:');
  for (const p of validPools.slice(0, 10)) {
    const coinAShort = p.coinA.split('::').pop() || p.coinA;
    const coinBShort = p.coinB.split('::').pop() || p.coinB;
    console.log(`  ${p.dex.padEnd(12)} ${p.id.slice(0, 18)}... ${coinAShort}/${coinBShort}`);
  }

  console.log('\n✨ Pool management complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
