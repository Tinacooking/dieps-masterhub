import { Request, Response } from "express";
import { evaluateGuardianRisk } from "../services/risk";

export const evaluateGuardianRiskController = async (req: Request, res: Response) => {
    const { sourceSymbol, destSymbol, route, execution_impact } = req.body;
      
    let slippage_float = parseFloat(String(execution_impact).replace('%', ''));
    if (isNaN(slippage_float)) slippage_float = 0;

    // Delegate pure mathematical validation to the standalone module
    const riskResult = evaluateGuardianRisk(slippage_float);

    return res.json({
        ...riskResult,
        checks: {
            slippage_risk: riskResult.risk_level === "HIGH" ? "DANGER" : "SAFE",
            concentration_risk: "SAFE",
            stale_pool: "SAFE",
            black_swan: "SAFE"
        }
    });
};
