import fs from 'fs';
import readline from 'readline';
import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path/unweighted';

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

    let count = 0;
    for await (const line of rl) {
        // Mock processing line: 0x...poolId
        count++;
        // We will simulate that the first few lines connect common tokens
        if (count === 1) {
            staticGraph.mergeNode("0x2::sui::SUI");
            staticGraph.mergeNode("0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC");
            staticGraph.mergeEdge("0x2::sui::SUI", "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", { poolId: line.trim() });
        }
        // Early break just to prevent massive memory usage for mock demonstration
        if (count > 100) break; 
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
    // In production, this uses SuiGrpcClient sui_multiGetObjects
    // const client = new SuiGrpcClient({ url: process.env.SUI_GRPC_ENDPOINT });
    // const res = await client.multiGetObjects({ ids: poolIds, options: { showContent: true } });
    
    // Mocking real-time RPC fetch of 50ms latency
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(poolIds.map(id => ({
                poolId: id,
                reserves: { tokenA: 10000, tokenB: 10000 },
                exchangeRate: 1.0 // Mock rate
            })));
        }, 50);
    });
}
