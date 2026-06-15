# 🧠 DIEPS: AI-Powered Intent Execution Protocol

![Network](https://img.shields.io/badge/Network-Sui_Network-4AA181?style=for-the-badge&logo=sui)
![Stack](https://img.shields.io/badge/Stack-React_%7C_Vite_%7C_Express-212121?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Beta_v2.0-8A2BE2?style=for-the-badge)

**DIEPS (Decentralized Intent Execution Protocol System)** is a next-generation liquidity intelligence and execution layer. It allows users to express their trading desires in natural language (e.g., *"Swap 1000 SUI for USDC with the safest route"*), dynamically resolves the optimal route using the Cetus Aggregator SDK, passes the transaction through our 100% On-Chain Risk Guardian, and seamlessly outputs a secure Programmable Transaction Block (PTB).

---

## 🌊 1. System Processing Flow

<p align="center">
  <img src="public/workflow-animation.svg" width="100%" alt="DIEPS Animated Workflow Diagram">
</p>

The core architecture runs on a 4-step pipeline designed to securely transition abstract user intent into deterministic blockchain execution:

1.  **Intent Parsing Engine (Solver):**
    *   Users input natural language requests.
    *   The engine extracts quantitative parameters (Source Token, Destination Token, Amount) and qualitative constraints (e.g., Safest, Fastest, Max Output).
    *   *Output:* A normalized Intent Object.
2.  **Graph State Manager (In-Memory Persistence):**
    *   Maintains an ultra-low latency (`< 200ms` refresh) directed acyclic graph (DAG) of actively monitored liquidity pools across various decentralized exchanges.
    *   *Output:* Current liquidity depth, fee ratios, and token balances.
3.  **Smart Routing Engine:**
    *   Processes the structured intent using the Cetus Aggregator SDK against live graph states to discover the most efficient multi-hop swap routes.
    *   *Output:* Optimal trade route (e.g., `SUI -> CETUS -> USDC` with proportional splits) and expected output.
4.  **100% On-Chain Risk Guardian & PTB Assembler:**
    *   Evaluates the route by querying live Sui RPC nodes for dynamic price impact, stale liquidity, and token supply concentration.
    *   Upon clearing the risk threshold (or receiving user override for flagged risks), the engine compiles a Sui Programmable Transaction Block (MoveCalls, Split/MergeCoins) ready for wallet signature.

---

## 🧠 2. Core Technologies & Architecture

### A. Gemini-Powered Intent Parsing
DIEPS moves away from traditional drop-downs and manual configurations. We utilize **Google Gemini 2.5 Flash** (via OpenRouter) fine-tuned for domain-specific slot extraction. This NLP engine transforms conversational requests into structured, deterministic JSON payloads containing source tokens, destination tokens, trade amounts, and specific constraints in milliseconds.

### B. Smart Route Optimization (Cetus SDK)
Instead of relying on rigid, hardcoded paths, DIEPS integrates the **Cetus Aggregator SDK** to autonomously search across deep liquidity pools on the Sui network. It analyzes fragmented liquidity to construct the most capital-efficient multi-hop swap routes, automatically splitting trades across different pools (e.g., Turbos, Cetus, DeepBook) to minimize slippage and maximize output.

### C. 100% On-Chain Risk Guardians
Before any transaction reaches the mempool, it must pass through our deterministic Risk Guardian Engine. Rather than theoretical models, the Guardian pulls 100% live data directly from Sui RPC nodes to evaluate:
1.  **Price Impact Guard:** Calculates actual estimated slippage against user thresholds.
2.  **Liquidity Freshness (Stale Check):** Ensures the pools involved have recent, active trading volume and are not abandoned.
3.  **Supply Concentration (Rug-Pull Check):** Analyzes token distribution. If an overwhelming percentage of a token's total supply is concentrated in a single wallet, the Guardian flags it as a high rug-pull risk.

**Deterministic Execution Thresholds:**
Based on the on-chain data, the Guardian makes discrete routing decisions:
*   **SAFE (Green Light):** The routing sequence is immediately passed to the PTB assembler.
*   **WARNING (Yellow Light):** Minor risks detected (e.g., slightly elevated slippage). Trade proceeds but with inline warnings.
*   **DANGER (Red Light):** Critical risks detected (e.g., massive price impact or extreme concentration). Execution is explicitly blocked, requiring the user to manually acknowledge and override the safety block before signing.

---

## 💻 3. Local Development Setup

Follow these steps to clone and run the DIEPS Engine locally.

### Prerequisites
*   **Node.js**: v18.0.0 or higher
*   **npm** or **yarn**
*   A Sui Ecosystem Wallet (Sui Wallet, Surf Wallet) installed in your browser.

### Installation

1. **Clone the repository** (or download the ZIP):
   ```bash
   git clone https://github.com/Tinacooking/dieps-masterhub.git
   cd dieps-masterhub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Copy the example environment variables and fill out API RPC endpoints if necessary.
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your custom `SUI_GRPC_ENDPOINT` if you do not want to use the public default RPCs.*

### Running the Application

This is a Full-Stack application containing both the React/Vite Frontend and the Express API Backend.

**Start the Development Server:**
```bash
npm run dev
```
> The development server will compile the backend on-the-fly and deploy Vite's HMR middleware. The application will be accessible at `http://localhost:3000`.

**Build for Production:**
Compile both the frontend SPA and bundle the backend TypeScript into a unified Node.js deployment.
```bash
npm run build
npm run start
```

---

## 🚀 4. Algorithm Processing & System Novelty

### The Intent Engine & Advanced Routing Integration
What fundamentally separates DIEPS from standard DEX aggregators is our **Intent Engine**, powered by a highly optimized integration of Google Gemini NLP and the Cetus Aggregator. Traditional swappers force users to understand liquidity fragmentation, hop paths, and route optimization. DIEPS flips this paradigm: users simply state their ultimate goal (their *intent*), and the engine independently handles the complexity under the hood.

Our team has fine-tuned this architecture to achieve unprecedented processing speeds. This optimization allows the Intent Engine to instantly parse natural language, compute multi-hop arbitrage paths across the Sui network, and synthesize the safest execution matrix in milliseconds.

### 🌐 Mass Adoption & Ecosystem Impact:
Our technological breakthroughs translate directly into ecosystem growth for the Sui blockchain:

- **Eradicating the UX Barrier for New Users:** DeFi is notoriously intimidating. By abstracting away complex parameters (slippage limits, pool comparisons, routing nodes) into simple, conversational interactions, DIEPS creates the ultimate frictionless onboarding experience. A first-time user can trade with the sophistication of an institutional quant without writing a single line of technical parameter.
- **Maximized Capital Efficiency:** By drastically reducing graph traversal time, our routing algorithm captures fleeting arbitrage opportunities and guarantees the absolute best exchange rates before market states evolve, ensuring users extract maximum value.
- **Driving Deep Ecosystem Liquidity:** A seamless, zero-anxiety execution environment is the catalyst for retail and institutional adoption. By making Sui the easiest blockchain to transact on, DIEPS serves as a liquidity magnet, ultimately increasing trading volume, TVL, and utilization across all integrated protocols in the Sui ecosystem.

---

## ⚖️ 5. Competitive Landscape on Sui

While the Sui ecosystem boasts robust DeFi infrastructure, DIEPS introduces an entirely new paradigm—shifting from manual aggregation to AI-driven intent execution. Here is how DIEPS compares to existing products on the Sui Blockchain:

### 1. DIEPS Protocol vs. Hop Aggregator & Cetus Aggregator
*   **Traditional Aggregators (Hop, Cetus):** Require the user to manually input specific tokens, select exact slippage limits, evaluate different routes, and construct the swap directly. The user bears the cognitive load of formulating the transaction.
*   **DIEPS (Intent Engine):** The user simply types *"Swap 1000 SUI for the safest USDC route"*. DIEPS naturally parses this, uses the **Cetus Smart Router** to find the deepest path, runs the **On-Chain Risk Guardian** to ensure safety, and autonomously synthesizes the exact Programmable Transaction Block (PTB). **DIEPS moves aggregation to the background, elevating the user experience to pure intent.**

### 2. DIEPS Protocol vs. Aftermath Finance (Smart Routing)
*   **Aftermath Finance:** Offers excellent routing and multi-asset pools, focusing on complex pathfinding. However, the interface remains fundamentally deterministic and manual—tailored for experienced DeFi users who understand pool weights.
*   **DIEPS (Intent Engine):** Not only matches the underlying multi-hop efficiency but adds a proactive **100% On-Chain Risk Guardian Engine**. If a route relies on a pool experiencing sudden high slippage or toxic concentration, DIEPS dynamically halts execution before submission. Furthermore, DIEPS allows new users to execute these complex, Aftermath-style multi-hop trades effortlessly through natural language, completely removing the steep learning curve.

### Conclusion
DIEPS does not replace aggregators; it acts as an intelligent overlay. By abstracting away the mechanical execution into natural language and reinforcing it with institutional-grade risk models, DIEPS aims to onboard the next one million retail users to the Sui Blockchain.

## 🔒 Security Notice
*This is an experimental interface Hackathon project running on Mainnet endpoints by default. Real PTB submission and Move execution features simulate their states unless connected to mainnet RPC nodes.*
