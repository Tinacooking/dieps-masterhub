import { Request, Response } from "express";
import { findSubGraphPools, fetchPoolsRealtime } from "../services/graph";

export const calculateOptimalRouteController = async (req: Request, res: Response) => {
    const { sourceAddress, destAddress, sourceSymbol, destSymbol, amount } = req.body;
    
    // Dynamic Sub-graph fetching & execution
    let poolIds = await findSubGraphPools(sourceAddress, destAddress);
    
    let bestPool = null;
    let poolSymbol = destSymbol || destAddress;
    
    if (poolIds.length > 0) {
        // Fetch real-time data from Sui RPC
        const realTimePools = await fetchPoolsRealtime(poolIds);
        
        if (realTimePools.length > 0) {
            // Sort to find the pool with highest liquidity
            realTimePools.sort((a, b) => Number(b.reserves.tokenA) - Number(a.reserves.tokenA));
            const selectedPool = realTimePools[0];
            
            // Calculate a rough exchange rate if liquidity exists, otherwise default 1.0
            let rate = 1.0;
            if (Number(selectedPool.reserves.tokenA) > 0 && Number(selectedPool.reserves.tokenB) > 0) {
                rate = Number(selectedPool.reserves.tokenB) / Number(selectedPool.reserves.tokenA);
            }
            
            bestPool = {
                dex: "Sui Deep Pool",
                priceUsd: rate.toString(),
                liquidity: Number(selectedPool.reserves.tokenA) || 50000,
                poolId: selectedPool.poolId
            };
        }
    }
    
    let routeNodes: any[] = [];
    let outputAmount = parseFloat(amount);
    let slippage = 0.05;
    
    if (bestPool) {
      const dexName = bestPool.dex ? bestPool.dex.charAt(0).toUpperCase() + bestPool.dex.slice(1) : "Unknown";
      const exchangeRate = bestPool.priceUsd ? parseFloat(bestPool.priceUsd) : 1;
      const fee = 0.003; 
      const liquidityDepth = bestPool.liquidity || 10000;
      const tradeSizeLimit = parseFloat(amount);
      
      slippage = Math.min((tradeSizeLimit / liquidityDepth) * 0.1, 0.05); 
      const weight = -Math.log(exchangeRate * (1 - fee) * (1 - slippage));
      
      routeNodes = [{ dex: dexName, ratio: 100, fee: fee * 100, weight: weight }];
      outputAmount = parseFloat(amount) * exchangeRate * (1 - fee) * (1 - slippage);
    } else {
        routeNodes = [{ dex: "Fallback Swap", ratio: 100, fee: 0.5, weight: 1 }];
        outputAmount = parseFloat(amount) * 0.95;
    }

    return res.json({
        route: routeNodes,
        dex_sequence: routeNodes.map((n) => n.dex),
        expected_output: outputAmount,
        minimum_output: outputAmount * 0.995,
        execution_impact: `${(slippage * 100).toFixed(2)}%`,
        route_confidence: poolIds.length > 0 ? 99 : 96,
        dynamicPoolUsed: poolIds.length > 0 || !!bestPool,
        poolDetails: bestPool
    });
};
