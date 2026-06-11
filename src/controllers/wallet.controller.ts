import { Request, Response } from "express";
import { resolveToken } from "../services/nlp";

export const getBalanceController = async (req: Request, res: Response) => {
    const { address, symbol } = req.body;
    
    if (!address || !symbol) {
      return res.status(400).json({ error: "Missing address or symbol" });
    }

    const tokenResult = await resolveToken(symbol.toUpperCase());
    let tokenAddress = tokenResult?.address || symbol;
    
    try {
      const endpoint = process.env.SUI_RPC_ENDPOINT || 'https://fullnode.mainnet.sui.io:443';
      const apiKey = process.env.SUI_API_KEY;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const rpcRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getBalance',
          params: [address, tokenAddress]
        })
      });
      const data = await rpcRes.json();
      
      if (data.result && data.result.totalBalance) {
        // Simple mock divisor for generic tokens
        let balance = Number(data.result.totalBalance) / 1e9;
        return res.json({ balance: balance.toString() });
      }
      
      return res.json({ balance: "0" });
    } catch (e) {
      console.error("Balance fetch error:", e);
      return res.status(500).json({ error: "Failed to fetch balance" });
    }
};

export const genericSuiRpcController = async (req: Request, res: Response) => {
    try {
      const endpoint = process.env.SUI_RPC_ENDPOINT || 'https://fullnode.mainnet.sui.io:443';
      const apiKey = process.env.SUI_API_KEY;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (apiKey) {
        headers['x-api-key'] = apiKey;
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const rpcRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      const data = await rpcRes.json();
      return res.json(data);
    } catch (e) {
      console.error("Sui RPC Proxy error:", e);
      return res.status(500).json({ error: "Failed to call RPC proxy" });
    }
};
