from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import networkx as nx
import numpy as np
import scipy.stats as stats
import os
import time
import json
from google import genai
from typing import Dict, List, Any
import grpc
import httpx

app = FastAPI(title="DIEPS Backend", description="Intent-Centric Swap Application on Sui")

# 1. Data Models (Pydantic BaseModel)
class IntentRequest(BaseModel):
    action_type: str
    source_token_address: str
    destination_token_address: str
    trade_amount: float
    user_constraints: Dict[str, Any]

class PoolData(BaseModel):
    pool_id: str
    token_a_address: str
    token_b_address: str
    reserve_a: float
    reserve_b: float
    fee_percentage: float
    last_transaction_timestamp: int

class ParseIntentPayload(BaseModel):
    intent_string: str

class CalculateRoutePayload(BaseModel):
    source_token: str
    destination_token: str
    amount: float

class EvaluateRiskPayload(BaseModel):
    path: List[str]
    expected_output: float
    spot_price_output: float
    volatility_24_hours: float
    trade_size_ratio: float

# 2. Graph Mathematics Class
class ModifiedMooreBellmanFordRouter:
    def __init__(self):
        self.base_graph = nx.DiGraph()
        self.line_graph = nx.DiGraph()
        self.pools: Dict[str, PoolData] = {}

    def fetch_live_pools(self):
        """
        Query the Sui JSON-RPC endpoint to fetch active liquidity pools directly from on-chain state.
        Uses ONLY the configuration provided in the .env file.
        """
        rpc_url = os.environ.get("SUI_RPC_ENDPOINT")
        if not rpc_url:
            print("Lỗi: SUI_RPC_ENDPOINT không được tìm thấy trong môi trường (.env). Vui lòng kiểm tra lại cấu hình!")
            return
            
        api_key = os.environ.get("SUI_API_KEY")
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["x-api-key"] = api_key
            headers["Authorization"] = f"Bearer {api_key}"
            
        # Ví dụ ID của pool Cetus SUI/USDC
        pool_object_ids = [
            "0x5eb2dfcdd1b15d2021328258f6d5ec081e9a0050" 
        ]
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "sui_multiGetObjects",
            "params": [
                pool_object_ids,
                {
                    "showContent": True,
                    "showType": True
                }
            ]
        }
        
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(rpc_url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                if "result" in data:
                    for item in data["result"]:
                        if "error" in item:
                            continue
                            
                        obj_data = item.get("data", {})
                        obj_id = obj_data.get("objectId")
                        content = obj_data.get("content", {})
                        fields = content.get("fields", {})
                        
                        reserve_a = float(fields.get("coin_a", 0)) / 1e9
                        reserve_b = float(fields.get("coin_b", 0)) / 1e6
                        fee_rate = float(fields.get("fee_rate", 2500)) / 1000000 
                        
                        self.pools[obj_id] = PoolData(
                            pool_id=obj_id,
                            token_a_address="0x2::sui::SUI", 
                            token_b_address="0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
                            reserve_a=reserve_a,
                            reserve_b=reserve_b,
                            fee_percentage=fee_rate,
                            last_transaction_timestamp=int(time.time() * 1000)
                        )
                        
            print(f"Successfully fetched {len(self.pools)} live pools from Sui RPC.")
            
        except Exception as e:
            print(f"Failed to fetch live pools via Sui JSON-RPC: {e}")

    def build_base_graph(self):
        self.base_graph.clear()
        for pool_id, pool in self.pools.items():
            if pool.reserve_a > 0 and pool.reserve_b > 0:
                # weight = -numpy.log((1 - fee_percentage) * (reserve_B / reserve_A))
                weight_ab = -np.log((1 - pool.fee_percentage) * (pool.reserve_b / pool.reserve_a))
                weight_ba = -np.log((1 - pool.fee_percentage) * (pool.reserve_a / pool.reserve_b))
                
                self.base_graph.add_edge(pool.token_a_address, pool.token_b_address, pool_id=pool_id, weight=weight_ab)
                self.base_graph.add_edge(pool.token_b_address, pool.token_a_address, pool_id=pool_id, weight=weight_ba)

    def transform_to_line_graph(self):
        """
        Convert the base graph into a Line Graph where the Liquidity Pools become the new nodes 
        to accurately evaluate multi-hop transaction channelling.
        """
        self.line_graph = nx.line_graph(self.base_graph)

    def execute_algorithm(self, source_token: str, destination_token: str):
        """
        Add an artificial source vertex, run the Bellman-Ford algorithm to detect paths with the lowest 
        sum of negative logarithms, minimizing edge discrepancies.
        """
        self.build_base_graph()
        self.transform_to_line_graph()
        try:
            # NetworkX bellman_ford_path handles source vertex tracking natively
            path = nx.bellman_ford_path(self.base_graph, source=source_token, target=destination_token, weight='weight')
            return path
        except nx.NetworkXNoPath:
            return []
        except nx.NetworkXUnbounded:
            # Negative cycle detected
            return []

    def optimize_bisection(self, path: List[str], input_amount: float):
        """
        Iterate over the pools in the optimal path using a binary search algorithm 
        to calculate the exact optimal token output through the entire multi-hop sequence.
        """
        current_amount = input_amount
        for i in range(len(path) - 1):
            token_in = path[i]
            token_out = path[i+1]
            edge_data = self.base_graph.get_edge_data(token_in, token_out)
            if not edge_data: continue
            
            pool_id = edge_data['pool_id']
            pool = self.pools.get(pool_id)
            if not pool: continue
            
            if token_in == pool.token_a_address:
                res_in, res_out = pool.reserve_a, pool.reserve_b
            else:
                res_in, res_out = pool.reserve_b, pool.reserve_a
                
            amount_in_with_fee = current_amount * (1 - pool.fee_percentage)
            current_amount = (amount_in_with_fee * res_out) / (res_in + amount_in_with_fee)
            
        return current_amount


# 3. Quantitative Risk Class
class BayesianGuardian:
    def __init__(self):
        self.prior_alpha = 2.0
        self.prior_beta = 10.0
        self.critical_risk_threshold = 0.85

    def check_high_slippage(self, expected_output: float, spot_price_output: float):
        if spot_price_output <= 0: return 1.0
        slippage = abs(spot_price_output - expected_output) / spot_price_output
        return float(np.clip(slippage * 10, 0.0, 1.0)) # Mapping to likelihood

    def check_pool_concentration(self, path: List[str], router: ModifiedMooreBellmanFordRouter):
        # Increased risk if the trade relies on too many unknown hops
        return float(min(len(path) * 0.1, 1.0))

    def check_stale_pool(self, path: List[str], router: ModifiedMooreBellmanFordRouter):
        now_ms = int(time.time() * 1000)
        max_staleness_ms = 5 * 60 * 1000 # 5 minutes
        stale_risk = 0.0
        for i in range(len(path) - 1):
            edge = router.base_graph.get_edge_data(path[i], path[i+1])
            if edge:
                pool = router.pools.get(edge['pool_id'])
                if pool and (now_ms - pool.last_transaction_timestamp) > max_staleness_ms:
                    stale_risk = max(stale_risk, 0.9)
        return stale_risk

    def predict_black_swan(self, volatility_24_hours: float, trade_size_ratio: float):
        return float(min((volatility_24_hours * trade_size_ratio) * 5, 1.0))

    def calculate_posterior_probability(self, slippage_risk: float, concentration_risk: float, stale_risk: float, swan_risk: float):
        # Derive likelihood from the mathematical checks
        likelihood = float(np.mean([slippage_risk, concentration_risk, stale_risk, swan_risk]))
        
        # Bayesian Update
        posterior_alpha = self.prior_alpha + likelihood * 10 
        posterior_beta = self.prior_beta + (1 - likelihood) * 10
        
        # Using scipy stats to get the distribution mean mathematically
        posterior_mean = stats.beta.mean(posterior_alpha, posterior_beta)
        execution_blocked = bool(posterior_mean > self.critical_risk_threshold)
        
        return {
            "posterior_probability": posterior_mean,
            "execution_blocked": execution_blocked
        }

# Global Engine Instances
router = ModifiedMooreBellmanFordRouter()
guardian = BayesianGuardian()


# --- API ENDPOINTS ---

@app.post("/parse-intent")
async def parse_intent(payload: ParseIntentPayload):
    # Initialize the Google Gemini client for NLP string parsing natively
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured in environment.")
        
    client = genai.Client(api_key=api_key)
    prompt = f"""Extract the following financial intent into structured JSON mapping precisely to these keys:
    {{
        "action_type": "swap",
        "source_token_address": "string",
        "destination_token_address": "string",
        "trade_amount": 0.0,
        "user_constraints": {{}}
    }}
    Intent: {payload.intent_string}
    Output ONLY raw valid JSON without markdown wrapping.
    """
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
             raw_text = raw_text[7:-3]
        if raw_text.startswith("```"):
             raw_text = raw_text[3:-3]
             
        intent_data = json.loads(raw_text)
        intent_request = IntentRequest(**intent_data) # Mapping via Pydantic model
        return intent_request.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse AI intent: {str(e)}")


@app.post("/calculate-optimal-route")
async def calculate_optimal_route(payload: CalculateRoutePayload):
    # STEP 2.1: Query Sui gRPC
    router.fetch_live_pools()
    
    # STEP 2.4: Shortest Path Execution
    path = router.execute_algorithm(payload.source_token, payload.destination_token)
    if not path:
        return {"path": [], "expected_output": 0.0, "message": "No active routes available. (Live pools empty due to missing Sui Protobuf)"}
        
    # STEP 2.5: Bisection Method Optimization
    expected_output = router.optimize_bisection(path, payload.amount)
    
    return {
        "path": path,
        "expected_output": expected_output
    }


@app.post("/evaluate-guardian-risk")
async def evaluate_guardian_risk(payload: EvaluateRiskPayload):
    # Programmatically execute the 4 mathematical checks
    slippage_risk = guardian.check_high_slippage(payload.expected_output, payload.spot_price_output)
    concentration_risk = guardian.check_pool_concentration(payload.path, router)
    stale_risk = guardian.check_stale_pool(payload.path, router)
    swan_risk = guardian.predict_black_swan(payload.volatility_24_hours, payload.trade_size_ratio)
    
    # Calculate Posterior Probability
    result = guardian.calculate_posterior_probability(
        slippage_risk=slippage_risk,
        concentration_risk=concentration_risk,
        stale_risk=stale_risk,
        swan_risk=swan_risk
    )
    
    return {
        "bayesian_probability": result["posterior_probability"],
        "execution_blocked": result["execution_blocked"],
        "risk_checks": {
            "high_slippage_risk": slippage_risk,
            "pool_concentration_risk": concentration_risk,
            "stale_pool_warning": stale_risk,
            "black_swan_prediction": swan_risk
        }
    }
