import { Router } from "express";
import { parseIntentController } from "../controllers/intent.controller";
import { calculateOptimalRouteController } from "../controllers/routing.controller";
import { evaluateGuardianRiskController } from "../controllers/risk.controller";
import { getBalanceController, genericSuiRpcController } from "../controllers/wallet.controller";

const router = Router();

// Endpoint phân tích ý định
router.post("/parse-intent", parseIntentController);

// Endpoint định tuyến đường đi
router.post("/calculate-optimal-route", calculateOptimalRouteController);

// Endpoint đánh giá rủi ro
router.post("/evaluate-guardian-risk", evaluateGuardianRiskController);

// Endpoints liên quan tới ví và RPC
router.post("/balance", getBalanceController);
router.post("/sui-rpc", genericSuiRpcController);

export default router;
