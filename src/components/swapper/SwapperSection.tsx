import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { TokenSelectorModal } from '../TokenSelectorModal';
import { SwapperHeader } from './SwapperHeader';
import { IntentChat } from './IntentChat';
import { RoutingPath } from './RoutingPath';
import { GuardianRisk } from './GuardianRisk';
import { PTBFlow } from './PTBFlow';

export const SwapperSection: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const dAppKit = useDAppKit();
  const disconnect = () => dAppKit.disconnectWallet();
  const walletAddress = currentAccount?.address || null;

  const [intentInput, setIntentInput] = useState("Swap 1000 SUI to USDC");
  const [appState, setAppState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [processStep, setProcessStep] = useState(0);
  const [submittedIntent, setSubmittedIntent] = useState("");
  const [executionState, setExecutionState] = useState<'idle' | 'executing' | 'success'>('idle');
  const [gasPrice, setGasPrice] = useState<string>("0.003");
  const [txHash, setTxHash] = useState<string | null>(null);

  const [sourceToken, setSourceToken] = useState("SUI");
  const [destToken, setDestToken] = useState("USDC");
  const [amount, setAmount] = useState("1000.00");
  const [routeNodes, setRouteNodes] = useState<any[]>([]);
  const [estOutput, setEstOutput] = useState<string>("0.00");
  const [sourceTokenBalance, setSourceTokenBalance] = useState<string>("0");
  const [hasConfirmedSettings, setHasConfirmedSettings] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [tokenModalMode, setTokenModalMode] = useState<'source' | 'dest' | null>(null);

  useEffect(() => {
    if (walletAddress && sourceToken) {
      fetch("/api/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress, symbol: sourceToken })
      })
        .then(r => r.json())
        .then(data => {
          if (data.balance) {
            setSourceTokenBalance(data.balance);
          }
        })
        .catch(e => console.error("Failed to fetch user balance for token", e));
    } else {
      setSourceTokenBalance("0");
    }
  }, [walletAddress, sourceToken]);

  const fetchGasPrice = async () => {
    try {
      const res = await fetch('/api/sui-rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getReferenceGasPrice',
          params: []
        })
      });
      const data = await res.json();
      if (data.result) {
        // Convert mist to SUI and add a small buffer for swap execution estimation
        const baseGas = (Number(data.result) * 3000000) / 1e9;
        setGasPrice(baseGas.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 5 }));
      }
    } catch (e) {
      console.error("Failed to fetch gas price", e);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentInput.trim()) return;

    setSubmittedIntent(intentInput);
    setAppState('processing');
    setProcessStep(0);
    setExecutionState('idle');
    setTxHash(null);
    setHasConfirmedSettings(false);

    try {
      // 1. Parse Intent API
      const parseRes = await fetch("/api/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: intentInput })
      });
      const parsedData = await parseRes.json();

      if (parsedData.error || !parsedData.intent) {
        throw new Error(parsedData.error || "Failed to parse intent");
      }

      setAmount(parsedData.intent.trade_amount || "0");
      setSourceToken(parsedData.intent.source_token_symbol || "SUI");
      setDestToken(parsedData.intent.destination_token_symbol || "USDC");

      setProcessStep(1);
      fetchGasPrice();

      // 2. Fetch Route API
      const routeRes = await fetch("/api/calculate-optimal-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceAddress: parsedData.intent.source_token_address,
          destAddress: parsedData.intent.destination_token_address,
          sourceSymbol: parsedData.intent.source_token_symbol,
          destSymbol: parsedData.intent.destination_token_symbol,
          amount: parsedData.intent.trade_amount
        })
      });
      const routeData = await routeRes.json();

      // Store the nodes safely from Layer 2
      setRouteNodes(routeData.route || []);
      setEstOutput(routeData.expected_output ? Number(routeData.expected_output).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00');

      setProcessStep(2);

      // 3. Layer 3: Evaluate Guardian Risk
      const guardianRes = await fetch("/api/evaluate-guardian-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceSymbol: parsedData.intent.source_token_symbol,
          destSymbol: parsedData.intent.destination_token_symbol,
          route: routeData.route,
          execution_impact: routeData.execution_impact,
        })
      });
      const guardianData = await guardianRes.json();

      // Store Risk Status in state if needed, for now we let it pass

      setProcessStep(3);

      setTimeout(() => {
        setProcessStep(4);
        setAppState('done');
      }, 1500);

    } catch (err) {
      console.error("Failed to simulate", err);
      setAppState('idle');
    }
  };

  const handleExecute = () => {
    if (!walletAddress) {
      setIsWalletModalOpen(true);
      return;
    }

    setExecutionState('executing');
    // Simulate transaction execution delay
    setTimeout(() => {
      setExecutionState('success');
      // Generate a mock Sui testnet digest hash starting with 0x...
      const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(mockHash);
    }, 2500);
  };

  useEffect(() => {
    if (appState === 'idle') {
      const regex = /swap\s+([\d.,]+)\s+([a-zA-Z]+)\s+(to|for)\s+([a-zA-Z]+)/i;
      const match = intentInput.match(regex);
      if (match) {
        setAmount(match[1].replace(/,/g, ''));
        setSourceToken(match[2].toUpperCase());
        setDestToken(match[4].toUpperCase());
      }
    }
  }, [intentInput, appState]);

  const isInsufficientBalance = walletAddress ? parseFloat(amount) > parseFloat(sourceTokenBalance) : false;

  return (
    <section id="swapper-section" className="snap-start snap-always w-full min-h-[100svh] lg:h-[100svh] py-6 md:py-8 bg-[#030008] relative border-t border-white/5 flex flex-col items-center justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[20%] left-[-100px] w-[350px] h-[350px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-100px] w-[350px] h-[350px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-16 flex flex-col lg:h-full max-h-[900px] gap-4 relative z-10">

        <SwapperHeader
          walletAddress={walletAddress}
          isWalletModalOpen={isWalletModalOpen}
          setIsWalletModalOpen={setIsWalletModalOpen}
          disconnect={disconnect}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-4 lg:gap-5 flex-1 min-h-0 w-full">

          <IntentChat
            intentInput={intentInput}
            setIntentInput={setIntentInput}
            appState={appState}
            processStep={processStep}
            submittedIntent={submittedIntent}
            amount={amount}
            sourceToken={sourceToken}
            destToken={destToken}
            handleSimulate={handleSimulate}
          />

          <RoutingPath
            appState={appState}
            processStep={processStep}
            executionState={executionState}
            sourceToken={sourceToken}
            destToken={destToken}
            amount={amount}
            routeNodes={routeNodes}
            estOutput={estOutput}
            gasPrice={gasPrice}
            hasConfirmedSettings={hasConfirmedSettings}
            setHasConfirmedSettings={setHasConfirmedSettings}
            walletAddress={walletAddress}
            isInsufficientBalance={isInsufficientBalance}
            txHash={txHash}
            handleExecute={handleExecute}
            isWalletModalOpen={isWalletModalOpen}
            setIsWalletModalOpen={setIsWalletModalOpen}
            setTokenModalMode={setTokenModalMode}
          />

          <div className={`lg:col-span-3 xl:col-span-3 flex flex-col gap-4 h-full min-h-0 transition-all duration-700 ease-out ${appState === 'idle' ? 'opacity-30 scale-[0.99] pointer-events-none select-none' : 'opacity-100 scale-100'}`}>
            {processStep >= 3 ? (
              <>
                <GuardianRisk processStep={processStep} />

                <PTBFlow
                  processStep={processStep}
                  routeNodes={routeNodes}
                  amount={amount}
                  sourceToken={sourceToken}
                />
              </>
            ) : (
              <div className="hidden xl:flex bg-[#050505] border border-white/5 rounded-[20px] p-6 flex-1 relative overflow-hidden flex-col min-h-0 justify-center items-center opacity-50">
                <span className="material-symbols-outlined text-[32px] text-[#444] mb-3">security</span>
                <span className="font-mono text-[9px] text-[#888] uppercase tracking-widest text-center">Guardian Engine<br />Standby</span>
              </div>
            )}
          </div>

        </div>
      </div>

      <TokenSelectorModal
        isOpen={tokenModalMode !== null}
        onClose={() => setTokenModalMode(null)}
        selectedToken={tokenModalMode === 'source' ? sourceToken : destToken}
        onSelect={(token) => {
          if (tokenModalMode === 'source') {
            setIntentInput(`Swap ${amount} ${token} to ${destToken}`);
          } else if (tokenModalMode === 'dest') {
            setIntentInput(`Swap ${amount} ${sourceToken} to ${token}`);
          }
        }}
      />
    </section>
  );
};
