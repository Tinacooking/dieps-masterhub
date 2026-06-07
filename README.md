#   <br>  <p align="center"><img src="https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield-alert.svg" width="80" height="80" alt="DIEPS Logo" /></p>  <h1 align="center">D I E P S</h1>  <p align="center"><b>Intent-Based Routing & Real-Time Risk Protection Core on Sui Network</b></p>  <p align="center">    <img src="https://img.shields.io/badge/Blockchain-Sui%20Testnet-blue?style=for-the-badge&logo=sui&logoColor=white" />    <img src="https://img.shields.io/badge/Node.js-v18%2B-green?style=for-the-badge&logo=node.js&logoColor=white" />    <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />    <img src="https://img.shields.io/badge/Built%20With-TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white" />  </p><br>

DIEPS is a next-generation decentralized application (dApp) designed to simplify multi-hop asset swappings and mitigate real-time transaction hazards on the Sui Network. Utilizing natural language execution protocols, an optimized multi-pool path finder, and dynamic risk verification modules, DIEPS bridges high-efficiency algorithmic routing with unmatched user-centric security.

---

## 🌟 Key Capabilities & Design Features

| Feature | Description | Key Tech Stack |
| :--- | :--- | :--- |
| 🗣️ **Simplifying Intents (NLP)** | Translates plain-English sentences into executable swap paths instantly. | Node Server API + LLM Parser |
| 📊 **Real-Time DEX Telemetry** | Polls live-market SUI/USDC/CETUS pool reserves every 1s from DexScreener. | DexScreener Public API |
| 🧭 **Multi-Hop Path Routing** | Continuous constant-product optimization to extract the absolute maximum output. | Optimized Golden-Section Pathfinder |
| 🛡️ **Risk Shield Guardian** | Continuously audits pools for adversarial slippage, low depth, and trading staleness. | Multi-Factor Algorithmic Risk Shield |
| 🔌 **Sui Wallet Standard** | Authentic cryptographic handshakes with browser extensions (Sui, Suiet, Okx, etc.). | Sui Wallet-Standard Protocol |

---

## 🛠️ Algorithmic Deep-Dive

### 1. Multi-Hop Path Routing Optimization

To route volatile tokens like **SUI** to **CETUS** via intermediary pools with maximal capital efficiency, the system calculates precise input allocation splits. Given a path:

$$P = [\text{pool}_1, \text{pool}_2, \dots, \text{pool}_k]$$

For each pool operating on a constant-product formula ($x \cdot y = k$), the input-output routing with fee $f$ is evaluated as:

$$\Delta b = \frac{\Delta a \cdot R_{\text{out}} \cdot (1 - f)}{R_{\text{in}} + \Delta a \cdot (1 - f)}$$

Using these exact non-linear mechanics, our multi-pool pathfinder runs a robust **bisection search** algorithm to yield precise outputs with near-zero tracking error.

```
[User Input SUI] ──> (SUI/USDC Liquidity Pool) ──> [Intermediate USDC] ──> (USDC/CETUS Pool) ──> [Output CETUS]
```

### 2. Risk Evaluation Engine (The Guardian Protection)

The Risk Shield protects users from on-chain MEV attacks and high-volatility threats by updating risk states over four steps:

- 📉 **Algorithmic Slippage Risk**: Compares the simulated bisection rate against the live pool spot price to detect front-running vectors.
- 🌊 **Pool Concentration Ratio**: Gauges overall pool asset reserve health. Low depth triggers block alerts.
- ⏱️ **Staleness Gap Metric**: Evaluates timespan since the latest transaction. Stale pools receive higher danger weights.
- 🔒 **Dynamic Control Blocker**: If the aggregated warning score exceeds the **85.0%** threshold, execution of the Programmable Transaction Block (PTB) is blocked.

---

## 💻 Local Desktop Setup & Installation

Follow these steps to deploy and run DIEPS on your local machine:

### 📋 Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Web3 Browser Wallet**: A compliant browser extension like [Sui Wallet](https://mystenlabs.com/), [Suiet](https://suiet.app/), or [OKX Wallet](https://www.okx.com/web3)

### 📥 1. Clone & Install Dependencies
Navigate into the project directory and install the required npm packages:
```bash
git clone <your-repository-url>
cd dieps
npm install
```

### ⚙️ 2. Environment Setup
Configure your environment secrets. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

---

## 🏃 Running the Application

DIEPS operates on a secure full-stack layout. The back-end shields API calls, while the client operates as an elegant, interactive dashboard.

### 🧪 Run in Development Mode
Launch both the Express backend API proxy and the Vite development environment on your machine:
```bash
npm run dev
```

The terminal will launch the interface:
```text
  ➜  Local:   http://localhost:3000
```
1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **Connect Wallet** in the top navigation panel.
3. Accept the cryptographic connection request from your browser wallet extension. You are now ready to trade!

### 🏗️ Build & Run in Production Mode
Compile the TypeScript files and bundle them for production-grade hosting:
```bash
# 1. Bundles client code to dist/ and compiles server TS files with esbuild
npm run build

# 2. Bootstraps the application via the production bundle
npm start
```

---

## 🔗 Customizing Blockchain RPC Nodes

To change network configurations, redirect your queries to alternate JSON-RPC nodes such as Sui Mainnet or custom developer indexes:

1. Open `/server.ts` in your workspace.
2. Update the `rpcUrl` address endpoint to your custom destination:
```typescript
// Replace with SUI Mainnet or your custom RPC URL:
const rpcUrl = "https://fullnode.testnet.sui.io"; 
```
3. Save the file and restart the server with `npm run dev` to apply configurations.

---

## 🛡️ Security Boundaries
- 🔑 **Invisible Keys**: Private configurations are processed on the server-side, protecting user details from leaking into browser tools.
- ✍️ **Safety Sign-Offs**: The dApp *never* persists or transmits your seed phrase or private key. Every transaction must be interactive and cryptographically verified inside your secure wallet dialog.
