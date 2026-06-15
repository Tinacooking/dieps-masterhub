/**
 * DIEPS Intent Engine — PTB Builder
 * Builds Programmable Transaction Blocks for swap execution on Sui Mainnet.
 * Integrates with Cetus Aggregator V3 route data.
 */

import { resolveToken, getTokenDecimals } from '../coin/tokenResolver.js';
import { getCoinsForSelection, selectCoinsForAmount } from '../coin/coinService.js';
import { suiRpcCall, SUI_MAINNET_RPC } from '../../utils/suiClient.js';
import { logger, createTimer } from '../../utils/logger.js';
import { AggregatorClient, Env } from '@cetusprotocol/aggregator-sdk';
import BN from 'bn.js';
import type { ExecuteSwapResult, PtbStep, RouteResult } from '../../types/index.js';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

/**
 * Build a serialized PTB for wallet signing.
 * Uses Cetus Aggregator route data when available, otherwise builds a basic swap PTB.
 */
export async function buildSwapPTB(params: {
  senderAddress: string;
  sourceSymbol: string;
  destSymbol: string;
  sourceAddress: string;
  destAddress: string;
  amount: string;
  slippage: number;
  routeData: RouteResult;
}): Promise<ExecuteSwapResult> {
  const timer = createTimer('buildSwapPTB');

  const {
    senderAddress,
    sourceSymbol,
    destSymbol,
    sourceAddress,
    destAddress,
    amount,
    slippage,
    routeData,
  } = params;

  const sourceToken = resolveToken(sourceSymbol);
  const destToken = resolveToken(destSymbol);
  const sourceDecimals = sourceToken?.decimals ?? 9;
  const amountInMist = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, sourceDecimals)));
  const isSuiSource = sourceSymbol.toUpperCase() === 'SUI';

  // Build PTB steps for display
  const ptbSteps: PtbStep[] = [];
  let stepIndex = 1;

  // Step 1: Split coins / get input coin
  if (isSuiSource) {
    ptbSteps.push({
      index: stepIndex++,
      command: 'SplitCoins',
      description: `Split ${amount} ${sourceSymbol} from gas coin`,
    });
  } else {
    ptbSteps.push({
      index: stepIndex++,
      command: 'MergeCoins',
      description: `Select and merge ${sourceSymbol} coins for ${amount}`,
    });
  }

  // Step 2+: Swap through each route hop
  if (routeData.route && routeData.route.length > 0) {
    for (const node of routeData.route) {
      ptbSteps.push({
        index: stepIndex++,
        command: 'MoveCall',
        target: `${node.dex.toLowerCase()}::swap::exact_in`,
        description: `Swap via ${node.dex} Pool (${node.ratio}%, ${node.fee}% fee)`,
      });
    }
  }

  // Final step: Transfer output to sender
  ptbSteps.push({
    index: stepIndex++,
    command: 'TransferObjects',
    description: `Transfer ${destSymbol} output to sender`,
  });

  // Build the actual transaction using Sui SDK
  let transactionBytes = '';
  let simulation = {
    success: false,
    gasUsed: '0',
    balanceChanges: [] as any[],
    error: undefined as string | undefined,
  };

  try {
    const { Transaction } = await import('@mysten/sui/transactions');
    const tx = new Transaction();
    tx.setSender(senderAddress);

    // Initialize Cetus Aggregator Client
    const clientSDK = new AggregatorClient('https://api-sui.cetus.zone/router_v3', senderAddress, Env.Mainnet);

    // Fetch exact route specifically for PTB Building, using the same providers as the UI route
    const providers = params.routeData.dex_sequence.map(dex => dex.toUpperCase());
    const routers = await clientSDK.findRouters({
      from: sourceAddress,
      target: destAddress,
      amount: new BN(amountInMist),
      byAmountIn: true,
      splitCount: 20,
      depth: 3,
      providers: providers.length > 0 ? providers : undefined,
    });

    if (!routers || !routers.paths) {
      throw new Error('No viable swap route found for PTB Builder.');
    }

    // Determine target slippage
    const maxSlippage = slippage / 100;

    // Use Cetus SDK to build the real swap transaction block
    await clientSDK.fastRouterSwap({
      router: routers,
      txb: tx,
      slippage: maxSlippage,
    });

    // Set gas budget for simulation
    tx.setGasBudget(50_000_000); // 0.05 SUI

    const client = new SuiJsonRpcClient({ url: SUI_MAINNET_RPC });

    // Build to bytes for simulation
    const builtBytes = await tx.build({ client });
    transactionBytes = Buffer.from(builtBytes).toString('base64');

    // Simulate the transaction
    try {
      const simResult = await suiRpcCall('sui_dryRunTransactionBlock', [transactionBytes]);
      if (simResult) {
        const gasCost = simResult.effects?.gasUsed;
        let totalGas = '0';
        if (gasCost) {
          const computation = BigInt(gasCost.computationCost || '0');
          const storage = BigInt(gasCost.storageCost || '0');
          const rebate = BigInt(gasCost.storageRebate || '0');
          const nonRefundable = BigInt(gasCost.nonRefundableStorageFee || '0');
          const calculatedGas = computation + storage - rebate + nonRefundable;
          totalGas = calculatedGas > 0n ? calculatedGas.toString() : computation.toString();
        }

        simulation = {
          success: simResult.effects?.status?.status === 'success',
          gasUsed: totalGas,
          balanceChanges: simResult.balanceChanges || [],
          error: simResult.effects?.status?.error,
        };
      }
    } catch (simErr: any) {
      logger.warn('Transaction simulation failed', { error: simErr.message });
      simulation.error = simErr.message;
    }

    // Re-serialize without gas budget for wallet to handle
    const txForWallet = new Transaction();
    txForWallet.setSender(senderAddress);

    // Build the real swap PTB again for the wallet payload
    await clientSDK.fastRouterSwap({
      router: routers,
      txb: txForWallet,
      slippage: maxSlippage,
    });

    // Serialize for wallet — let wallet handle gas
    // Note: client must be passed to resolve CoinWithBalance intents
    const serialized = await txForWallet.toJSON({ client });
    transactionBytes = serialized;

  } catch (err: any) {
    logger.error('PTB build failed', { error: err.message });
    simulation.error = err.message;
  }

  const result: ExecuteSwapResult = {
    transactionBytes,
    ptbSteps,
    simulation,
    routeSummary: {
      inputAmount: amount,
      inputToken: sourceSymbol,
      expectedOutput: routeData.expected_output?.toString() || '0',
      outputToken: destSymbol,
      priceImpact: routeData.execution_impact || '0%',
    },
  };

  timer.end({ success: simulation.success });
  return result;
}
