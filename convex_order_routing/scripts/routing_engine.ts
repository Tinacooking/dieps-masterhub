import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

/**
 * Convex Order Routing Engine for Sui
 * 
 * Based on the Angeris & Boyd optimal routing models (CFMMs).
 * 
 * Concept:
 * 1. Calculate the optimal trade sizes across N liquidity pools off-chain using a convex optimizer.
 * 2. Construct a single atomic Programmable Transaction Block (PTB) on Sui.
 * 3. The PTB splits the input tokens, routes them simultaneously to N DEXs,
 *    merges the outputs, and enforces a global slippage check.
 */

// Simulated output of an off-chain Convex Optimizer (e.g. PRIME algorithm)
// The algorithm has decided how to split 1000 INPUT tokens across 3 pools.
const OPTIMAL_SPLIT = [
    { pool: 'pool_A', amount: 300, expectedOutput: 290 }, // e.g. DeepBook
    { pool: 'pool_B', amount: 500, expectedOutput: 485 }, // e.g. Cetus
    { pool: 'pool_C', amount: 200, expectedOutput: 195 }, // e.g. Turbos
];

// Target contract details for our unified router (or directly to DEXs)
const ROUTER_PACKAGE_ID = '0x123...'; // Replace with actual published package ID

export async function buildConvexRoutingPTB(
    userAddress: string,
    inputCoinId: string, 
    totalInputAmount: number,
    minGlobalOutput: number
) {
    const tx = new Transaction();

    // 1. Resolve the input coin object
    const inputCoin = tx.object(inputCoinId);

    // 2. We extract exact amounts for Pool A and Pool B. 
    // The remainder goes to Pool C to avoid dust issues.
    const splitAmounts = [
        tx.pure.u64(OPTIMAL_SPLIT[0].amount),
        tx.pure.u64(OPTIMAL_SPLIT[1].amount),
    ];

    // Split the input coin into exact portions for the routes
    const [coinA, coinB] = tx.splitCoins(inputCoin, splitAmounts);
    
    // The original `inputCoin` now has the remaining balance (200 tokens), so it is `coinC`.
    const coinC = inputCoin;

    // 3. Execute swaps on each DEX in parallel using the Move calls
    // In a real scenario, you would call each DEX's specific swap function 
    // or a unified smart contract router you deploy.
    const outputA = tx.moveCall({
        target: `${ROUTER_PACKAGE_ID}::router::swap_pool_a`,
        arguments: [coinA]
    });

    const outputB = tx.moveCall({
        target: `${ROUTER_PACKAGE_ID}::router::swap_pool_b`,
        arguments: [coinB]
    });

    const outputC = tx.moveCall({
        target: `${ROUTER_PACKAGE_ID}::router::swap_pool_c`,
        arguments: [coinC]
    });

    // 4. Merge all output coins into a single coin
    tx.mergeCoins(outputA, [outputB, outputC]);

    // 5. Enforce Global Slippage Check
    // If the combined output is less than minGlobalOutput, the transaction aborts
    tx.moveCall({
        target: `${ROUTER_PACKAGE_ID}::router::assert_minimum_balance`,
        arguments: [
            outputA, 
            tx.pure.u64(minGlobalOutput)
        ]
    });

    // 6. Transfer the final merged coin back to the user
    tx.transferObjects([outputA], userAddress);

    return tx;
}

// Example usage
async function run() {
    console.log("Khởi tạo kết nối tới Sui Testnet RPC...");
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    // Khôi phục Keypair từ mnemonic bạn đã tạo
    const mnemonic = "casual among hole figure clutch fabric wait craft visa lava picture group";
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    const userAddress = keypair.toSuiAddress();
    
    console.log(`Đã kết nối với ví: ${userAddress}`);

    console.log("Building Convex Order Routing PTB...");
    // Lưu ý: ID này là dummy, trong thực tế bạn lấy từ số dư Coin thực tế của ví
    const dummyInputCoinId = '0x0000000000000000000000000000000000000000000000000000000000000001'; 

    const tx = await buildConvexRoutingPTB(
        userAddress,
        dummyInputCoinId,
        1000,
        960 // min acceptable output (e.g. max ~1% slippage globally)
    );
    
    // Gán người gửi
    tx.setSender(userAddress);

    // Build the transaction block against the Testnet (để tính toán gas, độ hợp lệ, v.v.)
    // Trong thực tế, bạn có thể gọi client.signAndExecuteTransaction({ signer: keypair, transaction: tx })
    console.log("Đang tiến hành build transaction block trên Testnet...");
    try {
        const txBytes = await tx.build({ client });
        console.log("PTB successfully constructed and validated locally!");
        console.log("Kích thước payload (bytes):", txBytes.length);
    } catch (e: any) {
        // Có thể lỗi do dummyInputCoinId không tồn tại trên mạng, đây là điều bình thường cho file demo
        console.log("Lỗi khi build (Do dummy data):", e.message);
    }
}

if (require.main === module) {
    run();
}
