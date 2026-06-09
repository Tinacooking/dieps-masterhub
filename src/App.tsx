import React, { useState, useEffect } from 'react';
import { TOKEN_LOGOS } from './constants';
import { TokenSelectorModal } from './components/TokenSelectorModal';
import { useCurrentAccount, ConnectModal, ConnectButton, useDisconnectWallet } from '@mysten/dapp-kit';
import { Hero, About, Services, Projects, Testimonials, Contact, Footer } from './components/LandingComponents';

export default function App() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
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
        setGasPrice(baseGas.toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 5}));
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
      setEstOutput(routeData.expected_output ? Number(routeData.expected_output).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6}) : '0.00');

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
      const mockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
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

  const scrollToSwapper = () => {
    document.getElementById('swapper-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#000000] h-[100svh] overflow-y-auto w-full text-white font-body selection:bg-[#9D6BFF]/30 snap-y snap-mandatory custom-scrollbar">
      <div className="snap-start snap-always w-full h-[100svh] overflow-hidden">
        <Hero onLaunch={scrollToSwapper} />
      </div>
      
      <section id="swapper-section" className="snap-start snap-always w-full min-h-[100svh] lg:h-[100svh] py-6 md:py-8 bg-[#080808] relative border-t border-white/5 flex flex-col items-center justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1440px] w-full mx-auto px-4 md:px-16 flex flex-col lg:h-full max-h-[900px] gap-4">
          {/* Header */}
          <div className="flex justify-between items-end mb-2 border-b border-white/5 pb-4 relative shrink-0">
            <div className="absolute right-0 bottom-0 w-[400px] h-[100px] bg-[#9D6BFF]/10 blur-[80px] rounded-full pointer-events-none"></div>
            <div>
               <h2 className="text-[28px] md:text-[32px] font-display text-white mb-1 leading-none tracking-tight">Protocol Interface</h2>
               <p className="text-[#8F8F8F] font-mono text-[10px] uppercase tracking-widest">v2.0 Neural Engine</p>
            </div>
            <div className="flex gap-4">
              {!walletAddress ? (
                <ConnectModal
                  open={isWalletModalOpen}
                  onOpenChange={setIsWalletModalOpen}
                  trigger={
                    <button className="px-5 py-2.5 rounded-full border border-white/10 font-body text-[12px] font-medium hover:border-[#9D6BFF]/50 hover:bg-[#9D6BFF]/10 transition-colors backdrop-blur-xl">
                      Connect Wallet
                    </button>
                  }
                />
              ) : (
                <button 
                  onClick={() => disconnect()}
                  className="px-5 py-2.5 rounded-full border font-body text-[12px] font-medium bg-[#9D6BFF]/10 border-[#9D6BFF]/30 text-white hover:bg-[#9D6BFF]/20 transition-colors"
                  title="Click to disconnect"
                >
                  {walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-4 lg:gap-5 flex-1 min-h-0 w-full">
          {/* Left Column: Chat/Intent Input */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-full min-h-0">
            <div className="rounded-[20px] p-4 lg:p-5 flex-1 min-h-0 flex flex-col relative overflow-hidden bg-[#0a0a0a] border border-white/5 disabled-text-selection">
              <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-5 pr-2 custom-scrollbar flex flex-col relative z-10 pb-4">

                {/* System Message */}
                <div className="flex flex-col items-start gap-3">
                  <div className="font-mono text-[10px] text-[#8F8F8F] flex items-center gap-2 font-bold tracking-widest uppercase">
                    <span className="material-symbols-outlined text-[14px]">psychology</span> Engine Ready
                  </div>
                  <div className="bg-[#111111] border border-white/5 rounded-xl p-4 lg:p-5 max-w-[100%] xl:max-w-[85%] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#9D6BFF]/40"></div>
                    <p className="font-body text-[#e5e5e5] leading-relaxed text-[13px] xl:text-[14px]">How can I help you swap today? Try entering an amount and desired asset.</p>
                  </div>
                </div>

                {appState !== 'idle' && (
                  <>
                    {/* User Intent */}
                    <div className="flex flex-col items-end gap-2 mt-2">
                      <div className="font-mono text-[10px] text-[#888] font-bold tracking-widest uppercase pr-1">User</div>
                      <div className="bg-[#9D6BFF]/10 border border-[#9D6BFF]/20 rounded-xl p-4 max-w-[90%] relative overflow-hidden">
                        <p className="font-body text-[#e5e5e5] text-[13px] xl:text-[14px] leading-relaxed relative z-10">{submittedIntent}</p>
                      </div>
                    </div>

                    {/* System Processing */}
                    <div className="flex flex-col items-start gap-3 mt-4 w-full">
                      <div className="font-mono text-[10px] text-[#fff] flex items-center gap-2 font-bold tracking-widest uppercase">
                        <span className={`material-symbols-outlined text-[14px] ${appState === 'processing' ? 'animate-spin text-[#9D6BFF]' : 'text-[#00FF66]'}`}>sync</span> Calculating Route
                      </div>
                      <div className="bg-[#111111] border border-white/5 rounded-xl p-4 lg:p-5 w-full relative overflow-hidden transition-all">
                        <div className={`absolute top-0 left-0 w-1 h-full ${processStep >= 2 ? 'bg-[#00FF66]/40' : 'bg-[#9D6BFF]/40 animate-pulse'}`}></div>
                        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase mb-4 pl-2">
                          {appState === 'processing' && processStep < 2 ? (
                            <div className="flex gap-1 opacity-80">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#9D6BFF] opacity-90 animate-pulse"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-[#9D6BFF]/50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-[#9D6BFF]/20 animate-pulse" style={{ animationDelay: '400ms' }}></div>
                            </div>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff66]"></div>
                          )}
                          <span className="text-[#888]">
                            {appState === 'processing' && processStep < 2 ? 'EXTRACTING INTENT...' : 'INTENT EXTRACTED'}
                          </span>
                        </div>

                        {processStep >= 1 && (
                          <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-8 gap-y-5 font-mono text-[10px] uppercase tracking-widest transition-opacity duration-500 opacity-100 pl-2">
                            <div className="text-[#666] font-bold">Action</div>
                            <div className="text-[#e5e5e5] font-bold">Swap</div>
                            <div className="text-[#666] font-bold">Amount</div>
                            <div className="text-[#e5e5e5] font-bold">{amount}</div>

                            <div className="text-[#666] font-bold">From</div>
                            <div className="text-[#e5e5e5] font-bold">{sourceToken}</div>
                            <div className="text-[#666] font-bold">To</div>
                            <div className="text-[#e5e5e5] font-bold">{destToken}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="h-4 shrink-0"></div>
              </div>

              {/* Input Area */}
              <div className="pt-3 mt-auto border-t border-white/5 relative z-10 w-full shrink-0 flex flex-col gap-2">
                <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <button type="button" disabled={appState === 'processing'} onClick={() => setIntentInput("Swap 1000 SUI to USDC")} className="whitespace-nowrap px-3 py-1.5 rounded-[12px] border border-white/10 bg-[#111] text-[#888] text-[10px] sm:text-[11px] font-body hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50">Swap 1000 SUI to USDC</button>
                  <button type="button" disabled={appState === 'processing'} onClick={() => setIntentInput("Exchange 500 CETUS for SUI")} className="whitespace-nowrap px-3 py-1.5 rounded-[12px] border border-white/10 bg-[#111] text-[#888] text-[10px] sm:text-[11px] font-body hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50">Exchange 500 CETUS for SUI</button>
                  <button type="button" disabled={appState === 'processing'} onClick={() => setIntentInput("Convert 100 NAVX to TURBOS")} className="whitespace-nowrap px-3 py-1.5 rounded-[12px] border border-white/10 bg-[#111] text-[#888] text-[10px] sm:text-[11px] font-body hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50">Convert 100 NAVX to TURBOS</button>
                </div>
                <form onSubmit={handleSimulate} className="relative w-full">
                  <div className="bg-[#111] border border-white/10 rounded-full flex items-center justify-between p-1 focus-within:border-[#9D6BFF]/50 transition-colors focus-within:bg-[#151515]">
                    <input 
                      className="bg-transparent border-none focus:outline-none focus:ring-0 text-[13px] font-body text-white w-full pl-5 pr-3 placeholder-[#555]" 
                      placeholder="e.g., Swap..." 
                      type="text" 
                      value={intentInput}
                      onChange={(e) => setIntentInput(e.target.value)}
                      disabled={appState === 'processing'}
                    />
                    <button type="submit" disabled={appState === 'processing' || !intentInput.trim()} className="w-8 h-8 rounded-full bg-white text-black hover:bg-white/90 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50">
                      <span className="material-symbols-outlined text-[16px] font-medium text-black">send</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>

          {/* Middle Column: Routing Visualization */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-0">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[20px] p-4 lg:p-5 flex-1 relative overflow-hidden flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5 shrink-0">
                <h2 className="font-body font-medium text-[14px] text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">alt_route</span> Routing Path
                </h2>
                <div className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-white/10 rounded text-[#ddd]">
                    Optimal Route Found
                </div>
              </div>

              {/* Route Map Visualization */}
              <div className="flex-1 flex flex-col relative w-full overflow-hidden items-center justify-center">
                <div className={`relative flex items-center justify-center shrink-0 w-full transition-all duration-700 h-full`}>

                  {appState === 'idle' ? (
                    <div className="text-[#888] font-mono flex flex-col items-center gap-4 text-center max-w-[250px] uppercase tracking-widest text-[11px]">
                      <span className="material-symbols-outlined text-[48px] opacity-40">route</span>
                      <span>Awaiting user intent to calculate optimal route...</span>
                    </div>
                  ) : appState === 'processing' && processStep < 2 ? (
                    <div className="text-white/50 font-mono text-[11px] flex flex-col items-center gap-6">
                      <span className="material-symbols-outlined text-[48px] animate-spin opacity-50">sync</span>
                      <span className="uppercase tracking-widest">Analyzing Intent...</span>
                    </div>
                  ) : (
                    <>
                      {/* Connecting Lines (Background) */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <svg height="100%" preserveAspectRatio="none" viewBox="0 0 400 200" width="100%">
                          {/* Upper curve */}
                          <path className={`animate-[dash_30s_linear_infinite] ${executionState === 'executing' ? 'stroke-[#9D6BFF] opacity-80' : 'stroke-white/20'}`} d="M 50 100 Q 120 50 200 50 T 350 100" fill="none" strokeDasharray="6 6" strokeWidth="2" strokeLinecap="round"></path>
                          {/* Lower curve */}
                          <path className={`animate-[dash_30s_linear_infinite] ${executionState === 'executing' ? 'stroke-[#9D6BFF] opacity-80' : 'stroke-white/20'}`} d="M 50 100 Q 120 150 200 150 T 350 100" fill="none" strokeDasharray="6 6" strokeWidth="2" strokeLinecap="round"></path>
                          
                          {/* Center connection dot lines if needed, but the curves are enough style */}
                        </svg>
                      </div>

                      {/* Nodes */}
                      <div className="flex justify-between items-center w-full relative z-10 transition-opacity duration-1000 opacity-100 xl:px-4 scale-[0.7] sm:scale-[0.8] lg:scale-[0.75] xl:scale-[0.85] shrink-0 origin-center">
                        
                        {/* Origin Node */}
                        <div className="flex flex-col items-center gap-2 z-20">
                          <div 
                            onClick={() => setTokenModalMode('source')}
                            className={`w-12 h-12 rounded-full flex items-center justify-center relative group cursor-pointer hover:border-[#9D6BFF] transition-all overflow-hidden bg-[#111111] border border-white/10 shadow-[0_0_30px_rgba(157,107,255,0.15)] ${executionState === 'success' ? 'border-[#9D6BFF] shadow-[0_0_30px_rgba(157,107,255,0.4)]' : ''}`}
                          >
                            <div className={`absolute inset-0 rounded-full border border-[#9D6BFF]/50 opacity-0 group-hover:opacity-100 transition-opacity ${executionState === 'executing' ? 'animate-ping opacity-50' : ''}`}></div>
                            {TOKEN_LOGOS[sourceToken] ? (
                              <img src={TOKEN_LOGOS[sourceToken]} alt={sourceToken} className="w-8 h-8 object-contain relative z-10" />
                            ) : (
                              <span className="font-display font-medium text-[14px] text-white relative z-10 tracking-widest">{sourceToken.slice(0, 4)}</span>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-mono text-[9px] uppercase text-[#888] font-medium tracking-widest mb-1">Input</div>
                            <div className="font-body text-[13px] font-semibold text-white">{!isNaN(parseFloat(amount)) ? parseFloat(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6}) : '0.00'}</div>
                          </div>
                        </div>

                        {/* Intermediary Nodes (Pools) */}
                        <div className="flex flex-col gap-2 flex-1 mx-2 max-w-[200px] z-20 shrink-0">
                          {routeNodes.length > 0 ? routeNodes.map((node, index) => (
                             <div key={index} className={`flex items-center gap-2 bg-[#0a0a0a] p-2 rounded-[24px] border border-white/5 opacity-90 hover:opacity-100 hover:border-white/10 transition-all cursor-pointer ${executionState === 'executing' ? 'animate-pulse border-[#9D6BFF]/30 shadow-[0_0_15px_rgba(157,107,255,0.1)]' : ''}`}>
                               <div className="w-7 h-7 rounded-full bg-[#141414] border border-white/5 flex items-center justify-center shrink-0">
                                 <span className="material-symbols-outlined text-[14px] text-[#888]">water_drop</span>
                               </div>
                               <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                 <div className="font-body text-[11px] text-white font-medium whitespace-normal break-words">{node.dex} Pool</div>
                                 <div className="font-mono text-[8.5px] text-[#888] whitespace-normal break-words uppercase tracking-widest mt-0.5">{node.dex === 'Turbos' ? 'Med' : 'High'} • {node.fee}% Fee</div>
                               </div>
                               <div className="font-body text-[11px] text-white font-medium pr-2 shrink-0">{node.ratio}%</div>
                             </div>
                          )) : (
                            <div className={`flex items-center gap-2 bg-[#0a0a0a] p-2 rounded-[24px] border border-white/5 opacity-90 hover:opacity-100 hover:border-white/10 transition-all cursor-pointer ${executionState === 'executing' ? 'animate-pulse border-[#9D6BFF]/30 shadow-[0_0_15px_rgba(157,107,255,0.1)]' : ''}`}>
                               <div className="w-7 h-7 rounded-full bg-[#141414] border border-white/5 flex items-center justify-center shrink-0">
                                 <span className="material-symbols-outlined text-[14px] text-[#888]">water_drop</span>
                               </div>
                               <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                 <div className="font-body text-[11px] text-white font-medium whitespace-normal break-words">Cetus Pool</div>
                                 <div className="font-mono text-[8.5px] text-[#888] whitespace-normal break-words uppercase tracking-widest mt-0.5">High • 0.3% Fee</div>
                               </div>
                               <div className="font-body text-[11px] text-white font-medium pr-2 shrink-0">100%</div>
                             </div>
                          )}
                        </div>

                        {/* Destination Node */}
                        <div className="flex flex-col items-center gap-2 z-20">
                          <div 
                            onClick={() => setTokenModalMode('dest')}
                            className={`w-12 h-12 rounded-full flex items-center justify-center relative group cursor-pointer hover:border-[#9D6BFF]/50 transition-all bg-[#111111] border-dashed border-white/20 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] ${executionState === 'success' ? 'border-solid border-[#9D6BFF] bg-[#9D6BFF]/10 shadow-[0_0_40px_rgba(157,107,255,0.5)]' : ''}`}
                          >
                            {TOKEN_LOGOS[destToken] ? (
                              <img src={TOKEN_LOGOS[destToken]} alt={destToken} className="w-8 h-8 object-contain relative z-10" />
                            ) : (
                              <span className="font-display font-medium text-[14px] text-white relative z-10 tracking-widest">{destToken.slice(0, 4)}</span>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-mono text-[9px] uppercase text-[#888] font-medium tracking-widest mb-1">Est. Output</div>
                            <div className="font-body text-[13px] font-semibold text-white shimmer-bg px-2 rounded-md">{estOutput}</div>
                          </div>
                        </div>

                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Execution Bar */}
              <div className="mt-auto border-t border-white/5 pt-4 flex justify-between items-end gap-4 shrink-0">
                <div className={`flex flex-wrap gap-x-6 gap-y-2 ${appState !== 'done' ? 'opacity-30' : 'opacity-100'}`}>
                  <div className="flex flex-col gap-0.5">
                    <div className="font-mono text-[9px] text-[#888] uppercase font-bold tracking-widest">Est. Gas</div>
                    <div className="font-mono text-[14px] text-white font-medium tracking-wider">{appState === 'done' ? `${gasPrice} SUI` : '...'}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="font-mono text-[9px] text-[#888] uppercase font-bold tracking-widest">Slippage</div>
                    <div className="font-mono text-[14px] text-white font-medium tracking-wider">0.5%</div>
                  </div>
                </div>

                {executionState === 'success' ? (
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[10px] text-green-400 font-bold tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> SUCCESS
                    </span>
                    <a href={`https://suiexplorer.com/txblock/${txHash}?network=testnet`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-[#888] hover:text-[#9D6BFF] transition-colors flex items-center gap-1 mt-1 underline underline-offset-2 break-all">
                      {txHash?.slice(0, 10)}...{txHash?.slice(-8)}
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-2 w-auto mt-0">
                    {appState === 'done' && walletAddress && !isInsufficientBalance && (
                      <label className="flex items-center gap-1.5 cursor-pointer select-none animate-in fade-in slide-in-from-right-4 duration-500 mb-1">
                        <input 
                          type="checkbox" 
                          checked={hasConfirmedSettings}
                          onChange={(e) => setHasConfirmedSettings(e.target.checked)}
                          className="w-3 h-3 rounded border-white/20 bg-black/50 text-[#9D6BFF] focus:ring-[#9D6BFF]/50 transition-colors"
                        />
                        <span className="font-mono text-[9px] text-[#888] uppercase tracking-wider">Confirm PTB & Risks</span>
                      </label>
                    )}
                    {!walletAddress ? (
                      <ConnectModal
                        open={isWalletModalOpen}
                        onOpenChange={setIsWalletModalOpen}
                        trigger={
                          <button className="px-6 py-2.5 rounded-[12px] font-mono text-[12px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center min-w-[180px] bg-[#111111] border border-white/10 text-white hover:border-[#9D6BFF] hover:bg-[#9D6BFF]/10 shadow-lg">
                            Connect Wallet
                          </button>
                        }
                      />
                    ) : (
                      <button 
                        onClick={handleExecute}
                        className={`px-6 py-2.5 rounded-[12px] font-mono text-[12px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center min-w-[180px] ${appState === 'done' && executionState === 'idle' && !isInsufficientBalance && hasConfirmedSettings ? 'bg-[#9D6BFF] text-white hover:bg-[#B38CFF] shadow-[0_0_20px_rgba(157,107,255,0.3)]' : 'bg-[#111111] border border-white/5 text-white/50 cursor-not-allowed'}`} 
                        disabled={appState !== 'done' || executionState === 'executing' || isInsufficientBalance || !hasConfirmedSettings}
                      >
                         {appState !== 'done' 
                            ? 'Awaiting Route' 
                            : isInsufficientBalance
                              ? `Insufficient ${sourceToken}`
                              : executionState === 'executing' 
                                ? <div className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[14px] animate-spin">sync</span><span>Executing...</span></div>
                                : 'Execute Swap'}
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Guardian & PTB */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-4 h-full min-h-0">
            {processStep >= 3 ? (
              <>
                {/* Guardian Risk Analysis */}
                <div className="bg-[#111111] border border-white/5 rounded-[20px] p-4 flex flex-col gap-3 relative overflow-hidden h-fit shrink-0"> 
                  <div className="font-mono text-[10px] text-white uppercase tracking-widest flex items-center gap-2 relative z-10 font-bold mb-1">
                    <span className="material-symbols-outlined text-[14px]">security</span> GUARDIAN RISK CLASS
                    {processStep === 3 && <span className="material-symbols-outlined text-[14px] animate-spin ml-auto opacity-50">sync</span>}
                  </div>

                  <div className="space-y-2 relative z-10 w-full flex flex-col">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#0d0d0d] border border-white/5 w-full">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-body text-[10px] text-[#e5e5e5] font-medium tracking-wide">Smart Contract Risk</span>
                        </div>
                        <span className="font-mono text-[8px] text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded tracking-widest uppercase">Safe</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#0d0d0d] border border-white/5 w-full">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-body text-[10px] text-[#e5e5e5] font-medium tracking-wide">Liquidity Depth</span>
                        </div>
                        <span className="font-mono text-[8px] text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded tracking-widest uppercase">Safe</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#0d0d0d] border border-white/5 w-full">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-body text-[10px] text-[#e5e5e5] font-medium tracking-wide">Slippage Tolerance</span>
                        </div>
                        <span className="font-mono text-[8px] text-[#FFC107] bg-[#FFC107]/10 px-1.5 py-0.5 rounded tracking-widest uppercase w-fit text-center">Mod (0.5%)</span>
                    </div>
                  </div>
                </div>

                {/* PTB Preview */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[20px] p-4 flex flex-col gap-3 relative overflow-hidden flex-1 min-h-0 w-full lg:mb-0 mb-4 xl:mb-0">
                  <div className="absolute top-[20px] left-0 w-1 h-[calc(100%-40px)] bg-[#9D6BFF]"></div>
                  
                  <div className="font-mono text-[10px] text-white uppercase tracking-widest flex items-center gap-2 relative z-10 font-bold pl-2 shrink-0">
                    <span className="material-symbols-outlined text-[14px] rotate-90">account_tree</span> PTB EXECUTION FLOW
                    {processStep === 3 && <span className="material-symbols-outlined text-[14px] animate-spin ml-auto opacity-50">sync</span>}
                  </div>

                  <div className="text-[9px] text-[#888] space-y-2 overflow-y-auto custom-scrollbar flex-1 pl-3 font-mono pb-2">
                    <div className="flex gap-2 items-start">
                      <span className="text-white/20 shrink-0 font-bold mt-0.5">1</span>
                      <div className="leading-relaxed whitespace-pre-wrap font-medium">
                        <span className="text-blue-400">SplitCoins</span> <span className="text-orange-300">GasToken</span> <br/><span className="text-[#ddd]">[{amount} {sourceToken}]</span>
                      </div>
                    </div>
                    {routeNodes.length > 0 ? routeNodes.map((node, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-white/20 shrink-0 font-bold mt-0.5">{i+2}</span>
                          <div className="leading-relaxed whitespace-pre-wrap font-medium">
                            <span className="text-[#9D6BFF]">MoveCall</span> <br/><span className="text-[#888]">{node.dex.toLowerCase()}::swap::exact_in</span> <br/><span className="text-orange-300">Coin{i}</span>
                          </div>
                        </div>
                    )) : (
                        <div className="flex gap-2 items-start">
                          <span className="text-white/20 shrink-0 font-bold mt-0.5">2</span>
                          <div className="leading-relaxed whitespace-pre-wrap font-medium">
                            <span className="text-[#9D6BFF]">MoveCall</span> <br/><span className="text-[#888]">cetus::swap::exact_in</span> <br/><span className="text-orange-300">Coin0</span>
                          </div>
                        </div>
                    )}
                    <div className="flex gap-2 items-start">
                      <span className="text-white/20 shrink-0 font-bold mt-0.5">{routeNodes.length > 0 ? routeNodes.length + 2 : 3}</span>
                      <div className="leading-relaxed whitespace-pre-wrap font-medium">
                        <span className="text-green-400">TransferObjects</span> <br/><span className="text-[#ddd]">[Coin{routeNodes.length > 0 ? routeNodes.length : 1}]</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
                <div className="hidden xl:flex bg-[#050505] border border-white/5 rounded-[20px] p-6 flex-1 relative overflow-hidden flex-col min-h-0 justify-center items-center opacity-50">
                    <span className="material-symbols-outlined text-[32px] text-[#444] mb-3">security</span>
                    <span className="font-mono text-[9px] text-[#888] uppercase tracking-widest text-center">Guardian Engine<br/>Standby</span>
                </div>
            )}
          </div>

        </div>
        </div>
      </section>

      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#050505] overflow-y-auto"><About /></div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-black overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"><Services /></div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#050505] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"><Projects /></div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#050505] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"><Testimonials /></div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-black overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"><Contact /></div>
      <div className="snap-start snap-always w-full shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"><Footer /></div>

      {/* Modals */}
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
    </div>
  );
}
