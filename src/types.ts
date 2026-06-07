export interface PoolData {
  pool_id: string;
  token_a_address: string;
  token_b_address: string;
  reserve_a: number;
  reserve_b: number;
  fee_percentage: number;
  last_transaction_timestamp: number;
}

export interface RouteStep {
  pool_id: string;
  token_a_address: string;
  token_b_address: string;
  fee_percentage: number;
  last_transaction_timestamp: number;
}

export interface ParseResponse {
  action_type: string;
  source_token_address: string;
  destination_token_address: string;
  trade_amount: number;
  user_constraints: {
    slippage: number;
    gas_budget: number;
  };
}

export interface RouteResponse {
  source_token: string;
  destination_token: string;
  trade_amount: number;
  optimal_path: RouteStep[];
  expected_output: number;
  spot_price_output: number;
}

export interface RiskChecks {
  slippage_risk: number;
  concentration_risk: number;
  stale_pool_risk: number;
  black_swan_risk: number;
}

export interface RiskResponse {
  posterior_probability: number;
  evidence_score: number;
  checks: RiskChecks;
  execution_blocked: boolean;
}
