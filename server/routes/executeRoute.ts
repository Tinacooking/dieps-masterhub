/**
 * Execute Route — POST /api/execute
 *
 * Accepts signed transaction bytes and executes on-chain via SUI RPC.
 */

import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

export const executeRouter = Router();

const SUI_RPC = process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443';

executeRouter.post('/', async (req: Request, res: Response) => {
  const { signedTransactionBytes, signature } = req.body;

  if (!signedTransactionBytes) {
    return res.status(400).json({ error: 'Missing required field: signedTransactionBytes' });
  }

  try {
    // Execute signed transaction via JSON-RPC
    const rpcRes = await fetch(SUI_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_executeTransactionBlock',
        params: [
          signedTransactionBytes,
          signature ? [signature] : [],
          {
            showEffects: true,
            showBalanceChanges: true,
            showEvents: true,
            showObjectChanges: true,
          },
          'WaitForLocalExecution',
        ],
      }),
    });

    const data = (await rpcRes.json()) as any;

    if (data.error) {
      return res.status(400).json({
        error: `Transaction execution failed: ${data.error.message}`,
        code: data.error.code,
      });
    }

    const result = data.result;
    const status = result?.effects?.status?.status;
    const digest = result?.digest;

    if (status !== 'success') {
      return res.status(400).json({
        error: `Transaction failed on-chain: ${result?.effects?.status?.error || 'Unknown error'}`,
        digest,
        status,
      });
    }

    return res.json({
      success: true,
      digest,
      status,
      balanceChanges: result?.balanceChanges || [],
      events: result?.events || [],
      objectChanges: result?.objectChanges || [],
      gasUsed: result?.effects?.gasUsed,
    });
  } catch (err: any) {
    console.error('[Execute] Error:', err);
    return res.status(500).json({ error: `Execution failed: ${err.message}` });
  }
});
