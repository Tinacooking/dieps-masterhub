import jstat from 'jstat';

export interface RouteExecution {
    dex: string;
    ratio: number;
    fee: number;
    weight: number;
}

export function evaluateGuardianRisk(slippagePercent: number): {
    risk_probability: number;
    risk_level: string;
    execution_blocked: boolean;
} {
    // Bayesian prior Beta(alpha, beta) -> Beta(2, 10) representing a safe prior
    let alpha = 2;
    let beta = 10;

    // Update prior based on evidence (slippage)
    // The higher the slippage, the more alpha (risk evidence) increases
    if (slippagePercent > 5) {
        alpha += 8; // Heavy risk evidence
        beta -= 2;
    } else if (slippagePercent > 1) {
        alpha += 3; // Moderate risk evidence
    } else {
        beta += 5; // Safe evidence
    }

    // Calculate expected value of Beta distribution as the posterior probability of risk
    // Mean of Beta(a, b) = a / (a + b)
    const posterior_probability = alpha / (alpha + beta);

    let risk_level = "LOW";
    let execution_blocked = false;

    if (posterior_probability > 0.7) {
        risk_level = "HIGH";
        execution_blocked = true;
    } else if (posterior_probability > 0.3) {
        risk_level = "MEDIUM";
    }

    return {
        risk_probability: parseFloat(posterior_probability.toFixed(4)),
        risk_level,
        execution_blocked
    };
}
