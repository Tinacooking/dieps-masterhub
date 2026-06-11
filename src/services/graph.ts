import fs from 'fs';
import readline from 'readline';
import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path/unweighted';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const suiClient = new SuiClient({ 
    url: process.env.SUI_RPC_ENDPOINT || getFullnodeUrl('mainnet') 
});

// Singleton instance of the graph
let staticGraph: Graph | null = null;

// Initialize the static graph from pool_related_ids.txt
export async function initializeGraph(filePath: string): Promise<void> {
    if (staticGraph) return;

    staticGraph = new Graph();
    
    // Start background scanner to parse 768k pool IDs over time
    // We do not await this, it runs in the background.
    startBackgroundScanner(filePath);
    
    console.log(`[Graph Service] Background scanner initialized. Populating graph...`);
}

async function startBackgroundScanner(filePath: string) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let poolBatch: string[] = [];
    for await (const line of rl) {
        if (line.trim()) {
            poolBatch.push(line.trim());
        }
        
        if (poolBatch.length >= 50) {
            try {
                const res = await suiClient.multiGetObjects({
                    ids: poolBatch,
                    options: { showType: true, showContent: true }
                });
                
                for (const obj of res) {
                    if (obj.data && obj.data.content && obj.data.content.dataType === 'moveObject') {
                        const fields = (obj.data.content as any).fields;
                        const typeStr = obj.data.type || "";
                        
                        // Extract token types
                        const coinA = fields.coin_a || fields.coin_type_a || typeStr.match(/<([^,]+),/)?.[1] || "UnknownTokenA";
                        const coinB = fields.coin_b || fields.coin_type_b || typeStr.match(/,\s*([^>]+)>/)?.[1] || "UnknownTokenB";
                        
                        // Calculate rough liquidity USD equivalent
                        // For generic scanning without an oracle, we assume tokenA or tokenB is SUI/USDC and check raw reserves
                        const rawLiquidityX = Number(fields.liquidity || fields.reserve_x || 0);
                        const rawLiquidityY = Number(fields.reserve_y || 0);
                        const estimatedLiquidity = (rawLiquidityX + rawLiquidityY) / 1e9; // Normalized
                        
                        // Filter pools with liquidity under 10k (as requested by user)
                        // If it's a deep pool, add to graph
                        if (estimatedLiquidity > 10000) {
                            staticGraph?.mergeNode(coinA.toLowerCase());
                            staticGraph?.mergeNode(coinB.toLowerCase());
                            staticGraph?.mergeEdge(coinA.toLowerCase(), coinB.toLowerCase(), { 
                                poolId: obj.data.objectId,
                                type: typeStr
                            });
                        }
                    }
                }
            } catch(e) {
                // Ignore RPC rate limit errors and continue
            }
            poolBatch = [];
            
            // Artificial delay to prevent RPC rate-limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}

export async function findSubGraphPools(sourceAddress: string, destAddress: string): Promise<string[]> {
    if (!staticGraph) throw new Error("Graph not initialized");

    if (!staticGraph.hasNode(sourceAddress) || !staticGraph.hasNode(destAddress)) {
        return []; // No path possible
    }

    // Use BFS (Shortest Path Unweighted) to find the path in the static graph
    const pathNodes = bidirectional(staticGraph, sourceAddress, destAddress);
    
    if (!pathNodes || pathNodes.length < 2) return [];

    const poolIds: string[] = [];
    
    // Extract edges between the nodes in the path
    for (let i = 0; i < pathNodes.length - 1; i++) {
        const u = pathNodes[i];
        const v = pathNodes[i + 1];
        
        // Find edges between u and v
        const edges = staticGraph.edges(u, v);
        if (edges.length > 0) {
            // Get attributes of the first edge
            const attributes = staticGraph.getEdgeAttributes(edges[0]);
            if (attributes && attributes.poolId) {
                poolIds.push(attributes.poolId);
            }
        }
    }

    return poolIds;
}

export async function fetchPoolsRealtime(poolIds: string[]) {
    if (!poolIds || poolIds.length === 0) return [];
    
    // Chunk requests up to 50 items (RPC limit)
    const chunks = [];
    for (let i = 0; i < poolIds.length; i += 50) {
        chunks.push(poolIds.slice(i, i + 50));
    }
    
    let allPools = [];
    for (const chunk of chunks) {
        try {
            const res = await suiClient.multiGetObjects({
                ids: chunk,
                options: { showContent: true }
            });
            
            for (const obj of res) {
                if (obj.data && obj.data.content && obj.data.content.dataType === 'moveObject') {
                    const fields = (obj.data.content as any).fields;
                    // Standardizing Cetus / FlowX / Turbos basic fields for routing
                    const rawLiquidity = fields.liquidity || fields.reserve_x || 0;
                    
                    allPools.push({
                        poolId: obj.data.objectId,
                        reserves: { tokenA: rawLiquidity, tokenB: fields.reserve_y || 0 },
                        exchangeRate: 1.0, // Should be calculated based on reserves ratio or sqrtPrice
                        rawFields: fields,
                        type: obj.data.type
                    });
                }
            }
        } catch (error) {
            console.error(`[Graph Service] Error fetching real-time pool chunk:`, error);
        }
    }
    return allPools;
}
