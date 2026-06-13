/**
 * Intent Route — POST /api/intent
 *
 * Full pipeline: NLP Parser → Token Audit → Routing → Guardian
 * Returns { ptbBytes, guardianWarnings, humanReadablePreview }
 */

import { Router, Request, Response } from 'express';
import { intentParserService } from '../services/intentParserService.js';
import { auditTokenService } from '../services/auditTokenService.js';
import { routingService } from '../services/routingService.js';
import { guardianService } from '../services/guardianService.js';

export const intentRouter = Router();

intentRouter.post('/', async (req: Request, res: Response) => {
  const { text, userAddress } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing required field: text' });
  }
  if (!userAddress || typeof userAddress !== 'string') {
    return res.status(400).json({ error: 'Missing required field: userAddress' });
  }

  try {
    // ─── Step 1: NLP Intent Parsing ───────────────────────────────────
    console.log('[Intent] Parsing:', text);
    const parseResult = await intentParserService.parseIntent(text);

    if (!parseResult.success || !parseResult.intent) {
      return res.status(400).json({
        error: parseResult.error || 'Failed to parse intent',
        unsupportedChain: parseResult.intent?.unsupportedChain || false,
      });
    }

    const intent = parseResult.intent;
    console.log('[Intent] Parsed:', intent);

    // ─── Step 2: Audit Token Service ─────────────────────────────────
    // Validate source token
    const sourceAudit = await auditTokenService.fullAudit(intent.sourceTokenSymbol);
    if (!sourceAudit.goPlusClean) {
      return res.status(403).json({
        error: `Security Alert: The contract for ${intent.sourceTokenSymbol} is unverified or flagged as unsafe.`,
        warnings: sourceAudit.warnings,
      });
    }

    // Validate target token
    const targetAudit = await auditTokenService.fullAudit(intent.targetTokenSymbol);
    if (!targetAudit.goPlusClean) {
      return res.status(403).json({
        error: `Security Alert: The contract for ${intent.targetTokenSymbol} is unverified or flagged as unsafe.`,
        warnings: targetAudit.warnings,
      });
    }

    // Check if tokens are in whitelist (warning only for on-chain validation)
    const sourceToken = auditTokenService.resolveSymbol(intent.sourceTokenSymbol);
    const targetToken = auditTokenService.resolveSymbol(intent.targetTokenSymbol);

    if (!sourceToken) {
      return res.status(400).json({
        error: `Token "${intent.sourceTokenSymbol}" is not in the verified whitelist. Supported: SUI, USDC, USDT, CETUS, DEEP, NAVX, TURBOS, MMT`,
      });
    }
    if (!targetToken) {
      return res.status(400).json({
        error: `Token "${intent.targetTokenSymbol}" is not in the verified whitelist. Supported: SUI, USDC, USDT, CETUS, DEEP, NAVX, TURBOS, MMT`,
      });
    }

    // ─── Step 3: Line-Graph Routing & PTB Construction ───────────────
    console.log('[Intent] Computing route:', sourceToken.coinType, '→', targetToken.coinType);
    const routeResult = await routingService.computeRoute(
      sourceToken.coinType,
      targetToken.coinType,
      intent.amountIn,
      userAddress,
      intent.maxSlippage
    );

    // ─── Step 4: Guardian Pre-Sign Audit ─────────────────────────────
    const dexRate = routeResult.expectedOutput > 0
      ? routeResult.expectedOutput / intent.amountIn
      : 0;

    const guardianResult = await guardianService.evaluate(
      routeResult.path,
      routeResult.expectedOutput,
      intent.amountIn,
      intent.sourceTokenSymbol,
      intent.targetTokenSymbol,
      targetToken.coinType,
      routeResult.ptbBytes,
      dexRate
    );

    // ─── Step 5: Respond ─────────────────────────────────────────────
    return res.json({
      // Core response
      ptbBytes: routeResult.ptbBytes,
      guardianWarnings: guardianResult.warnings,
      humanReadablePreview: routeResult.humanReadablePreview,

      // Intent details
      intent: {
        action_type: 'SWAP',
        source_token_symbol: intent.sourceTokenSymbol,
        source_token_address: sourceToken.coinType,
        destination_token_symbol: intent.targetTokenSymbol,
        destination_token_address: targetToken.coinType,
        trade_amount: intent.amountIn.toString(),
        max_slippage: intent.maxSlippage,
      },

      // Route details
      route: routeResult.path.map((h) => ({
        dex: h.dexName,
        poolId: h.poolId,
        coinIn: h.coinTypeIn.split('::').pop(),
        coinOut: h.coinTypeOut.split('::').pop(),
        fee: (h.feeRate * 100).toFixed(2) + '%',
        weight: h.weight,
      })),
      expected_output: routeResult.expectedOutput,
      minimum_output: routeResult.minimumOutput,

      // Guardian details
      guardian: {
        risk_level: guardianResult.overallRisk,
        risk_probability: guardianResult.riskProbability,
        execution_blocked: guardianResult.executionBlocked,
        checks: guardianResult.checks.map((c) => ({
          name: c.name,
          status: c.status,
          score: c.score,
          detail: c.detail,
        })),
      },

      // Audit details
      audits: {
        source: { ...sourceAudit },
        target: { ...targetAudit },
      },
    });
  } catch (err: any) {
    console.error('[Intent] Pipeline error:', err);
    return res.status(500).json({ error: `Intent processing failed: ${err.message}` });
  }
});
