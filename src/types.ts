export interface ParseResponse {
  intent: {
    action: string;
    source_token_symbol: string;
    destination_token_symbol: string;
    trade_amount: string;
  };
  error?: string;
}

export interface RouteResponse {
  routes: any[];
  expected_output: number;
  source_token_symbol: string;
  destination_token_symbol: string;
  error?: string;
}
