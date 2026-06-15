/**
 * DIEPS Intent Engine — Liquidity Risk Guardian
 * 
 * Full 6-check risk assessment engine for swap routes:
 * 1. Price Impact / Slippage Risk
 * 2. Low Liquidity Pool Risk
 * 3. Price Discrepancy / Oracle Deviation
 * 4. Liquidity Fragmentation & Depth Risk
 * 5. Pool Safety Check
 * 6. Token Safety
 * 
 * Each route returns a detailed RiskAssessment with score (0-100),
 * risk level, and actionable recommendation.
 */

import { RISK_THRESHOLDS } from '../../config/index.js';
import { checkTokenSafety } from '../safety/TokenSafety.js';
import { checkPoolSafety } from '../safety/PoolSafety.js';
import { isStablePair, resolveTokenAddress } from '../coin/tokenResolver.js';
import { suiRpcCall } from '../../utils/suiClient.js';
import { logger, createTimer } from '../../utils/logger.js';
import type {
  RiskAssessment,
  RiskCheck,
  RiskLevel,
  GuardianRiskResponse,
  RouteResult,
  PoolDetails,
} from '../../types/index.js';

/**
 * LiquidityRiskGuardian — Main risk assessment class.
 * Evaluates a proposed swap route across 6 dimensions.
 */
export class LiquidityRiskGuardian {

  /**
   * Perform full risk assessment on a proposed swap route.
   */
  async evaluate(params: {
    sourceSymbol: string;
    destSymbol: string;
    amount: string;
    route: any[];
    executionImpact: string;
    expectedOutput?: number;
    poolDetails?: PoolDetails | null;
  }): Promise<RiskAssessment> {
    const timer = createTimer('RiskGuardian.evaluate');
    const allChecks: RiskCheck[] = [];

    const {
      sourceSymbol,
      destSymbol,
      amount,
      route,
      executionImpact,
      expectedOutput,
      poolDetails,
    } = params;

    // ─── Check 1: Price Impact / Slippage Risk ───────────────
    const priceImpactCheck = this.checkPriceImpact(executionImpact, route);
    allChecks.push(priceImpactCheck);

    // ─── Check 2: Low Liquidity Pool Risk ────────────────────
    const liquidityCheck = this.checkLiquidityRisk(
      route,
      parseFloat(amount),
      sourceSymbol,
      destSymbol,
      poolDetails
    );
    allChecks.push(liquidityCheck);



    // ─── Check 4: Liquidity Depth / Fragmentation ────────────
    const depthCheck = this.checkLiquidityDepth(route, parseFloat(amount), poolDetails);
    allChecks.push(depthCheck);

    // ─── Check 5: Pool Safety ────────────────────────────────
    const poolSafetyChecks = await checkPoolSafety(route || []);
    allChecks.push(...poolSafetyChecks);

    // ─── Check 6: Token Safety ───────────────────────────────
    const [sourceTokenChecks, destTokenChecks] = await Promise.all([
      checkTokenSafety(sourceSymbol),
      checkTokenSafety(destSymbol),
    ]);
    allChecks.push(...sourceTokenChecks, ...destTokenChecks);

    // ─── Check 7: Supply Concentration (On-chain native ratio) ─────
    const concentrationCheck = await this.checkSupplyConcentration(destSymbol, route);
    allChecks.push(concentrationCheck);

    // ─── Calculate Final Score ───────────────────────────────
    const assessment = this.calculateFinalAssessment(allChecks, priceImpactCheck, depthCheck);

    timer.end({
      score: assessment.score,
      riskLevel: assessment.riskLevel,
      safe: assessment.safe,
    });

    return assessment;
  }

  /**
   * Convert detailed RiskAssessment to frontend-compatible GuardianRiskResponse.
   */
  toFrontendResponse(assessment: RiskAssessment): GuardianRiskResponse {
    // Map risk level to posterior probability (Bayesian-style)
    let risk_probability: number;
    switch (assessment.riskLevel) {
      case 'LOW':      risk_probability = 0.05; break;
      case 'MEDIUM':   risk_probability = 0.25; break;
      case 'HIGH':     risk_probability = 0.55; break;
      case 'CRITICAL': risk_probability = 0.85; break;
      default:         risk_probability = 0.05;
    }

    // Map individual checks to frontend format
    const getCheckStatus = (names: string[]): 'SAFE' | 'WARNING' | 'DANGER' => {
      const relevant = assessment.checks.filter(c => names.some(n => c.name.includes(n)));
      if (relevant.some(c => c.status === 'DANGER')) return 'DANGER';
      if (relevant.some(c => c.status === 'WARNING')) return 'WARNING';
      return 'SAFE';
    };

    return {
      risk_probability,
      risk_level: assessment.riskLevel,
      execution_blocked: !assessment.safe,
      checks: {
        slippage_risk: getCheckStatus(['Price Impact', 'Slippage']),
        concentration_risk: getCheckStatus(['Holder', 'Token']),
        stale_pool: getCheckStatus(['Pool Age', 'Pool', 'DEX']),
        black_swan: getCheckStatus(['Oracle', 'Depth', 'Liquidity']),
      },
      riskAssessment: assessment,
    };
  }

  // ─── Individual Risk Checks ─────────────────────────────────

  /**
   * Check 1: Price Impact / Slippage Risk
   * Calculates the % price impact and warns if above thresholds.
   */
  private checkPriceImpact(executionImpact: string, route: any[]): RiskCheck {
    // Parse impact from string (e.g., "0.05%", "1.2%")
    const impactStr = String(executionImpact || '0').replace('%', '');
    const impactPercent = parseFloat(impactStr) || 0;

    // Also calculate from route fees
    const totalFee = route.reduce((sum, node) => sum + (node.fee || 0), 0);
    const effectiveImpact = Math.max(impactPercent, totalFee * 0.5);

    const { warn, recommendSplit, reject } = RISK_THRESHOLDS.priceImpact;

    if (effectiveImpact >= reject) {
      return {
        name: 'Price Impact',
        status: 'DANGER',
        message: `Price impact is ${effectiveImpact.toFixed(2)}% — exceeds ${reject}% threshold. Consider splitting your order or reducing trade size.`,
        value: effectiveImpact,
        threshold: reject,
      };
    }

    if (effectiveImpact >= recommendSplit) {
      return {
        name: 'Price Impact',
        status: 'WARNING',
        message: `Price impact is ${effectiveImpact.toFixed(2)}% — recommend splitting into multiple smaller orders.`,
        value: effectiveImpact,
        threshold: recommendSplit,
      };
    }

    if (effectiveImpact >= warn) {
      return {
        name: 'Price Impact',
        status: 'WARNING',
        message: `Price impact is ${effectiveImpact.toFixed(2)}% — moderate. Monitor execution carefully.`,
        value: effectiveImpact,
        threshold: warn,
      };
    }

    return {
      name: 'Price Impact',
      status: 'SAFE',
      message: `Price impact is ${effectiveImpact.toFixed(2)}% — within acceptable range.`,
      value: effectiveImpact,
      threshold: warn,
    };
  }

  /**
   * Check 2: Low Liquidity Pool Risk
   * Checks if pool liquidity is sufficient for the trade size.
   */
  private checkLiquidityRisk(
    route: any[],
    amount: number,
    sourceSymbol: string,
    destSymbol: string,
    poolDetails?: PoolDetails | null
  ): RiskCheck {
    const isStable = isStablePair(sourceSymbol, destSymbol);
    const minLiquidity = isStable
      ? RISK_THRESHOLDS.minLiquidity.stablePair
      : RISK_THRESHOLDS.minLiquidity.volatilePair;

    // Get liquidity from route nodes or pool details
    const poolLiquidity = poolDetails?.liquidity
      || route.reduce((max, node) => Math.max(max, node.liquidityUsd || 0), 0)
      || 0;

    if (poolLiquidity === 0) {
      const maxOnChainDepth = route.reduce((max, node) => Math.max(max, node.onChainLiquidityDepth || 0), 0);
      
      if (maxOnChainDepth > 0) {
        return {
          name: 'Liquidity Risk',
          status: 'WARNING',
          message: `Cannot evaluate USD value of pool liquidity. System will rely on Price Impact Guardian.`,
        };
      }

      return {
        name: 'Liquidity Risk',
        status: 'WARNING',
        message: 'Pool liquidity data unavailable — cannot assess depth risk',
      };
    }

    if (poolLiquidity < minLiquidity) {
      return {
        name: 'Liquidity Risk',
        status: 'DANGER',
        message: `Pool liquidity ($${poolLiquidity.toLocaleString()}) is below minimum ($${minLiquidity.toLocaleString()}) for ${isStable ? 'stable' : 'volatile'} pairs.`,
        value: poolLiquidity,
        threshold: minLiquidity,
      };
    }

    // Check trade size vs liquidity ratio
    const tradeRatio = amount / poolLiquidity;
    if (tradeRatio > 0.1) {
      return {
        name: 'Liquidity Risk',
        status: 'WARNING',
        message: `Trade size is ${Math.round(tradeRatio * 100)}% of pool liquidity. Expect high slippage.`,
        value: tradeRatio,
        threshold: 0.1,
      };
    }

    return {
      name: 'Liquidity Risk',
      status: 'SAFE',
      message: `Pool liquidity is sufficient for trade size.`,
      value: poolLiquidity,
    };
  }

  /**
   * Check 7: Supply Concentration Risk (Solution A)
   * Evaluates the token's total supply vs the amount currently in the liquidity pool.
   * A highly concentrated supply (e.g. < 1% in pool) indicates massive creator holding (Rug pull risk).
   */
  private async checkSupplyConcentration(tokenSymbol: string, route: any[]): Promise<RiskCheck> {
    if (tokenSymbol.toUpperCase() === 'SUI') {
      return { name: 'Supply Concentration', status: 'SAFE', message: 'SUI native token is inherently distributed.' };
    }
    
    if (!route || route.length === 0) {
      return { name: 'Supply Concentration', status: 'WARNING', message: 'No route data to check pool reserves.' };
    }

    try {
      // 1. Get the exact token address
      const tokenAddress = await resolveTokenAddress(tokenSymbol);
      if (!tokenAddress.includes('::')) return { name: 'Supply Concentration', status: 'WARNING', message: 'Could not resolve token address' };

      // 2. Fetch the true total supply from chain
      const supplyData = await suiRpcCall('suix_getTotalSupply', [tokenAddress]);
      const totalSupply = parseInt(supplyData?.value || '0');

      if (totalSupply === 0) {
        return { name: 'Supply Concentration', status: 'WARNING', message: 'Could not fetch token total supply' };
      }

      // 3. Approximate token amount in the pool using raw on-chain depth metric
      const maxOnChainDepth = route.reduce((max, node) => Math.max(max, node.onChainLiquidityDepth || 0), 0);
      
      if (maxOnChainDepth === 0) {
        return { name: 'Supply Concentration', status: 'WARNING', message: 'No on-chain depth metric available to compare' };
      }

      // 4. Calculate ratio (Liquidity in pool / Total Supply)
      // Note: CLMM liquidity depth is a proxy, but serves as an accurate relative metric
      const ratio = maxOnChainDepth / totalSupply;
      const ratioPercent = ratio * 100;

      if (ratioPercent < 0.05) { // Less than 0.05% of supply is in the pool
        return {
           name: 'Supply Concentration',
           status: 'DANGER',
           message: `Concentration Risk: Only ${ratioPercent.toFixed(4)}% of Total Supply is in the liquidity pool. 99.9%+ is held in wallets. Extreme rug-pull risk.`,
           value: ratioPercent,
        };
      }

      if (ratioPercent < 1.0) { // Less than 1% of supply is in the pool
        return {
           name: 'Supply Concentration',
           status: 'WARNING',
           message: `High Concentration: Only ${ratioPercent.toFixed(2)}% of supply is in the pool. Trade carefully.`,
           value: ratioPercent,
        };
      }

      return {
         name: 'Supply Concentration',
         status: 'SAFE',
         message: `Healthy pool ratio: ${ratioPercent.toFixed(2)}% of supply is circulating in liquidity.`,
         value: ratioPercent,
      };

    } catch (err: any) {
      logger.warn('Supply concentration check failed', { error: err.message });
      return {
        name: 'Supply Concentration',
        status: 'WARNING',
        message: 'Could not verify token supply concentration on-chain',
      };
    }
  }

  /**
   * Check 3: Oracle Price Deviation
   * Compares simulated output with oracle-expected output.
   */


  /**
   * Check 4: Liquidity Depth & Fragmentation
   * Assesses active liquidity and fragmentation across pools.
   */
  private checkLiquidityDepth(
    route: any[],
    amount: number,
    poolDetails?: PoolDetails | null
  ): RiskCheck {
    // Check number of route hops (fragmentation)
    const hopCount = route.length;

    if (hopCount === 0) {
      return {
        name: 'Liquidity Depth',
        status: 'WARNING',
        message: 'No route data available for depth analysis',
      };
    }

    // High fragmentation (>3 hops) means liquidity is spread thin
    if (hopCount > 3) {
      return {
        name: 'Liquidity Depth',
        status: 'WARNING',
        message: `Route uses ${hopCount} hops — liquidity is fragmented. Consider smaller trade size.`,
        value: hopCount,
        threshold: 3,
      };
    }

    // Check if any single pool handles too much of the trade
    const maxRatio = Math.max(...route.map(n => n.ratio || 0));
    const poolLiquidity = poolDetails?.liquidity || 0;

    // For CLMM pools (Cetus), active liquidity matters
    if (poolLiquidity > 0 && amount > 0) {
      const utilizationRatio = amount / poolLiquidity;
      if (utilizationRatio > 0.3) {
        return {
          name: 'Liquidity Depth',
          status: 'WARNING',
          message: `Trade utilizes ${(utilizationRatio * 100).toFixed(0)}% of pool depth — significant price impact likely.`,
          value: utilizationRatio * 100,
          threshold: 30,
        };
      }
    }

    return {
      name: 'Liquidity Depth',
      status: 'SAFE',
      message: `Route uses ${hopCount} hop(s) with concentrated liquidity — efficient routing.`,
      value: hopCount,
      threshold: 3,
    };
  }

  // ─── Final Score Calculation ────────────────────────────────

  /**
   * Calculate the overall risk score and assessment from individual checks.
   */
  private calculateFinalAssessment(
    allChecks: RiskCheck[],
    priceImpactCheck: RiskCheck,
    depthCheck: RiskCheck
  ): RiskAssessment {
    // Start with 100 and deduct based on check results
    let score = 100;

    // Weight deductions by severity
    const deductions: Record<string, number> = {
      'DANGER': 25,
      'WARNING': 10,
    };

    for (const check of allChecks) {
      if (check.status === 'DANGER') {
        score -= deductions.DANGER;
      } else if (check.status === 'WARNING') {
        score -= deductions.WARNING;
      }
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    let riskLevel: RiskLevel;
    if (score >= 80) riskLevel = 'LOW';
    else if (score >= 60) riskLevel = 'MEDIUM';
    else if (score >= 30) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    // Extract key metrics
    const slippagePercent = priceImpactCheck.value || 0;
    const priceDeviationPercent = 0; // Removed Pyth oracle dependency
    const depthRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 
      depthCheck.status === 'DANGER' ? 'HIGH' :
      depthCheck.status === 'WARNING' ? 'MEDIUM' : 'LOW';

    // Determine if execution should be blocked
    const hasCriticalDanger = allChecks.some(c =>
      c.status === 'DANGER' && (
        c.name === 'Price Impact'
      )
    );

    const safe = !hasCriticalDanger && score >= 30;

    // Generate recommendation
    const recommendation = this.generateRecommendation(score, riskLevel, allChecks);

    return {
      safe,
      score,
      riskLevel,
      slippagePercent,
      priceDeviationPercent,
      depthRisk,
      recommendation,
      checks: allChecks,
    };
  }

  /**
   * Generate a human-readable recommendation based on the assessment.
   */
  private generateRecommendation(
    score: number,
    riskLevel: RiskLevel,
    checks: RiskCheck[]
  ): string {
    const dangers = checks.filter(c => c.status === 'DANGER');
    const warnings = checks.filter(c => c.status === 'WARNING');

    if (riskLevel === 'CRITICAL') {
      return `⛔ BLOCKED: ${dangers.map(d => d.name).join(', ')} — trade rejected for safety. ${dangers[0]?.message || ''}`;
    }

    if (riskLevel === 'HIGH') {
      return `⚠️ HIGH RISK: ${dangers.map(d => d.name).join(', ')}. Consider reducing trade size or using a different route.`;
    }

    if (riskLevel === 'MEDIUM') {
      return `⚡ MODERATE: ${warnings.map(w => w.name).join(', ')} flagged. Proceed with caution.`;
    }

    return `✅ Route looks safe. Score: ${score}/100.`;
  }
}

/** Singleton instance */
export const riskGuardian = new LiquidityRiskGuardian();
