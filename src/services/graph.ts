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
    
    // In a real scenario, we would parse each pool ID, fetch its tokens, and add edges.
    // To avoid long startup times during development, we'll simulate building the adjacency list.
    // We only add nodes if they don't exist.
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // Read the first 50 Pool IDs to build the initial real data subgraph
    // (Processing 768k pool IDs via RPC would take hours and require a dedicated Indexer Database)
    let poolBatch: string[] = [];
    for await (const line of rl) {
        if (line.trim()) {
            poolBatch.push(line.trim());
        }
        if (poolBatch.length >= 50) break; 
    }
    
    // Fetch real Token Types for these pools
    if (poolBatch.length > 0) {
        try {
            const res = await suiClient.multiGetObjects({
                ids: poolBatch,
                options: { showType: true, showContent: true }
            });
            
            for (const obj of res) {
                if (obj.data && obj.data.content && obj.data.content.dataType === 'moveObject') {
                    const fields = (obj.data.content as any).fields;
                    // Extract token types (handling variations from Dexes like Cetus/Turbos/FlowX)
                    const coinA = fields.coin_a || fields.coin_type_a || obj.data.type?.match(/<([^,]+),/)?.[1] || "UnknownTokenA";
                    const coinB = fields.coin_b || fields.coin_type_b || obj.data.type?.match(/,\s*([^>]+)>/)?.[1] || "UnknownTokenB";
                    
                    staticGraph.mergeNode(coinA);
                    staticGraph.mergeNode(coinB);
                    staticGraph.mergeEdge(coinA, coinB, { poolId: obj.data.objectId });
                }
            }
        } catch(e) {
            console.error("[Graph Service] Failed to fetch initial real pool data:", e);
        }
    }
    
    console.log(`[Graph Service] Initialized static graph with ${staticGraph.order} tokens and ${staticGraph.size} pools.`);
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
                        rawFields: fields
                    });
                }
            }
        } catch (error) {
            console.error(`[Graph Service] Error fetching real-time pool chunk:`, error);
        }
    }
    return allPools;
}
