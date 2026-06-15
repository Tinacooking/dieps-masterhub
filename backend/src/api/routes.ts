/**
 * DIEPS Intent Engine — API Routes
 * All REST endpoints for the Intent Engine backend.
 * 
 * Endpoints:
 * - POST /api/parse-intent       — Parse natural language swap intent
 * - POST /api/calculate-optimal-route — Find best swap route via Cetus V3
 * - POST /api/evaluate-guardian-risk  — Run Risk Guardian assessment
 * - POST /api/balance            — Get token balance for address
 * - POST /api/sui-rpc            — Proxy JSON-RPC calls to Sui fullnode
 * - POST /api/execute-swap       — Build & return serializable PTB for wallet
 */

import { Router } from 'express';
import { validateBody } from './middleware.js';
import {
  ParseIntentSchema,
  CalculateRouteSchema,
  EvaluateGuardianSchema,
  BalanceSchema,
  ExecuteSwapSchema,
  ProcessIntentSchema,
} from '../types/index.js';
import { parseIntent } from '../services/llm/intentParser.js';
import { findOptimalRoute } from '../services/router/cetusRouter.js';
import { riskGuardian } from '../services/risk/LiquidityRiskGuardian.js';
import { getFormattedBalance } from '../services/coin/coinService.js';
import { buildSwapPTB } from '../services/router/ptbBuilder.js';
import { suiRpcProxy } from '../utils/suiClient.js';
import { logger } from '../utils/logger.js';

export const apiRouter = Router();

// ─── POST /api/parse-intent ────────────────────────────────────

apiRouter.post('/parse-intent', validateBody(ParseIntentSchema), async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await parseIntent(prompt);
    return res.json(result);
  } catch (err: any) {
    logger.warn('Intent parsing failed', { error: err.message });
    return res.status(400).json({
      error: err.message || 'Invalid intent format',
      validation_status: 'INVALID_FORMAT',
    });
  }
});

// ─── POST /api/calculate-optimal-route ─────────────────────────

apiRouter.post('/calculate-optimal-route', validateBody(CalculateRouteSchema), async (req, res) => {
  try {
    const { sourceAddress, destAddress, sourceSymbol, destSymbol, amount } = req.body;

    const routeResult = await findOptimalRoute(
      sourceSymbol,
      destSymbol,
      sourceAddress,
      destAddress,
      amount
    );

    return res.json(routeResult);
  } catch (err: any) {
    logger.error('Route calculation failed', { error: err.message });
    return res.status(500).json({
      error: err.message || 'Failed to calculate route on-chain. No viable pool or liquidity found.',
    });
  }
});

// ─── POST /api/evaluate-guardian-risk ──────────────────────────

apiRouter.post('/evaluate-guardian-risk', validateBody(EvaluateGuardianSchema), async (req, res) => {
  try {
    const { sourceSymbol, destSymbol, route, execution_impact } = req.body;

    const assessment = await riskGuardian.evaluate({
      sourceSymbol,
      destSymbol,
      amount: '0', // Amount not always provided in the guardian call
      route: route || [],
      executionImpact: String(execution_impact || '0'),
      expectedOutput: 0,
      poolDetails: null,
    });

    // Return backward-compatible format
    const response = riskGuardian.toFrontendResponse(assessment);
    return res.json(response);
  } catch (err: any) {
    logger.error('Guardian evaluation failed', { error: err.message });
    return res.status(500).json({
      error: err.message || 'Failed to evaluate risk on-chain.',
    });
  }
});

// ─── POST /api/balance ─────────────────────────────────────────

apiRouter.post('/balance', validateBody(BalanceSchema), async (req, res) => {
  try {
    const { address, symbol } = req.body;
    const balance = await getFormattedBalance(address, symbol);
    return res.json({ balance });
  } catch (err: any) {
    logger.error('Balance fetch failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// ─── POST /api/sui-rpc ────────────────────────────────────────

apiRouter.post('/sui-rpc', async (req, res) => {
  try {
    const data = await suiRpcProxy(req.body);
    return res.json(data);
  } catch (err: any) {
    logger.error('Sui RPC proxy error', { error: err.message });
    return res.status(500).json({ error: 'Failed to call RPC proxy' });
  }
});

// ─── POST /api/execute-swap ────────────────────────────────────

apiRouter.post('/execute-swap', validateBody(ExecuteSwapSchema), async (req, res) => {
  try {
    const {
      senderAddress,
      sourceSymbol,
      destSymbol,
      sourceAddress,
      destAddress,
      amount,
      slippage,
      routerData,
    } = req.body;

    // First, get the optimal route if not provided
    let routeResult = routerData;
    if (!routeResult || !routeResult.route) {
      // If addresses are missing, resolve them
      const resolvedSourceAddress = sourceAddress || await resolveToken(sourceSymbol)?.address || '';
      const resolvedDestAddress = destAddress || await resolveToken(destSymbol)?.address || '';
      routeResult = await findOptimalRoute(
        sourceSymbol,
        destSymbol,
        resolvedSourceAddress,
        resolvedDestAddress,
        amount
      );
    }

    // Build the PTB
    const ptbResult = await buildSwapPTB({
      senderAddress,
      sourceSymbol,
      destSymbol,
      sourceAddress,
      destAddress,
      amount,
      slippage: slippage || 0.5,
      routeData: routeResult,
    });

    return res.json(ptbResult);
  } catch (err: any) {
    logger.error('Execute swap failed', { error: err.message });
    return res.status(500).json({
      error: err.message || 'Failed to build swap transaction',
    });
  }
});

// ─── POST /api/process-intent ──────────────────────────────────

apiRouter.post('/process-intent', validateBody(ProcessIntentSchema), async (req, res) => {
  try {
    const { prompt, senderAddress, slippage } = req.body;

    // 1. Parse Intent
    const parseResult = await parseIntent(prompt);
    const intent = parseResult.intent;

    if (intent.action_type !== 'SWAP') {
      throw new Error(`Only SWAP actions are supported. Found: ${intent.action_type}`);
    }

    // 2. Calculate Route
    const routeResult = await findOptimalRoute(
      intent.source_token_symbol,
      intent.destination_token_symbol,
      intent.source_token_address,
      intent.destination_token_address,
      intent.trade_amount
    );

    // 3. Guardian Risk Assessment
    const riskAssessment = await riskGuardian.evaluate({
      sourceSymbol: intent.source_token_symbol,
      destSymbol: intent.destination_token_symbol,
      amount: intent.trade_amount,
      route: routeResult.route,
      executionImpact: routeResult.execution_impact,
      expectedOutput: routeResult.expected_output,
      poolDetails: routeResult.poolDetails,
    });

    // 4. Try to Build PTB for Simulation/Display (Ignore errors if wallet is dummy or balance is insufficient)
    let ptbResult: any = null;
    try {
      ptbResult = await buildSwapPTB({
        senderAddress,
        sourceSymbol: intent.source_token_symbol,
        destSymbol: intent.destination_token_symbol,
        sourceAddress: intent.source_token_address,
        destAddress: intent.destination_token_address,
        amount: intent.trade_amount,
        slippage: slippage || 0.5,
        routeData: routeResult,
      });
    } catch (ptbErr: any) {
      logger.warn('Skipped full PTB build during intent parsing (likely insufficient balance or dummy wallet). Will build at execution phase.', { error: ptbErr.message });
      // Generate mock ptbResult to ensure UI can still render steps
      ptbResult = {
        transactionBytes: null,
        ptbSteps: [
          { index: 1, command: 'Verify Balance', description: 'Checking wallet balance at execution' },
          { index: 2, command: 'Build PTB', description: 'Generating transaction dynamically' }
        ],
        simulation: { success: false, gasUsed: '0', balanceChanges: [], error: ptbErr.message },
        routeSummary: {
          inputAmount: intent.trade_amount,
          inputToken: intent.source_token_symbol,
          expectedOutput: routeResult.expected_output?.toString() || '0',
          outputToken: intent.destination_token_symbol,
          priceImpact: routeResult.execution_impact || '0%',
        }
      };
    }

    // 5. Unified Response
    return res.json({
      intent,
      route: routeResult,
      guardian: {
        safe: riskAssessment.safe,
        score: riskAssessment.score,
        riskLevel: riskAssessment.riskLevel,
        checks: riskAssessment.checks, // Plain language checks
      },
      ptb: ptbResult,
    });

  } catch (err: any) {
    logger.error('Process Intent failed', { error: err.message });

    if (err.message && err.message.startsWith('UNKNOWN_TOKEN:')) {
      const missingSymbol = err.message.split(':')[1] || 'Token';
      return res.status(400).json({
        error: `The system could not find the token. '${missingSymbol}'. Please provide the correct Contract address (for example: Swap 10 SUI to 0x...::${missingSymbol.toLowerCase()}::${missingSymbol.toUpperCase()})`,
      });
    }

    return res.status(500).json({
      error: err.message || 'Failed to process intent pipeline',
    });
  }
});
