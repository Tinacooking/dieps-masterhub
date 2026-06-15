import React, { useEffect, useRef } from 'react';
// ConnectModal is handled in SwapperHeader
import { TOKENS, getTokenInfo } from '../../constants';
import { gsap } from 'gsap';

interface RoutingPathProps {
  appState: 'idle' | 'processing' | 'done';
  processStep: number;
  executionState: 'idle' | 'executing' | 'success';
  sourceToken: string;
  destToken: string;
  amount: string;
  routeNodes: any[];
  estOutput: string;
  gasPrice: string;
  hasConfirmedSettings: boolean;
  setHasConfirmedSettings: (val: boolean) => void;
  walletAddress: string | null;
  isInsufficientBalance: boolean;
  txHash: string | null;
  handleExecute: () => void;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  setTokenModalMode: (mode: 'source' | 'dest' | null) => void;
  isSafe?: boolean;
  slippage?: string;
}

export const RoutingPath: React.FC<RoutingPathProps> = ({
  appState,
  processStep,
  executionState,
  sourceToken,
  destToken,
  amount,
  routeNodes,
  estOutput,
  gasPrice,
  hasConfirmedSettings,
  setHasConfirmedSettings,
  walletAddress,
  isInsufficientBalance,
  txHash,
  handleExecute,
  isWalletModalOpen,
  setIsWalletModalOpen,
  setTokenModalMode,
  isSafe = true,
  slippage = "0.5"
}) => {
  const sourceRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Infinite bobbing animation on the source node wrapper
    const sourceBob = gsap.to(sourceRef.current, {
      y: -6,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    // Infinite bobbing animation on the destination node wrapper (phase offset)
    const destBob = gsap.to(destRef.current, {
      y: 6,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 0.5
    });

    return () => {
      sourceBob.kill();
      destBob.kill();
    };
  }, []);
  return (
    <div className={`lg:col-span-5 xl:col-span-5 flex flex-col h-full min-h-0 transition-all duration-700 ease-out ${appState === 'idle' ? 'opacity-40 scale-[0.99] pointer-events-none select-none' : 'opacity-100 scale-100'}`}>
      <div className="bg-[#0a0416]/90 border border-white/5 rounded-[20px] p-4 lg:p-5 flex-1 relative overflow-hidden flex flex-col min-h-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5 shrink-0">
          <h2 className="font-body font-medium text-[14px] text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">alt_route</span> Smart Swapping Engine
          </h2>
          <div className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-white/10 rounded text-[#ddd]">
            Optimal Route Found
          </div>
        </div>

        {/* Route Map Visualization */}
        <div className="flex-1 flex flex-col relative w-full overflow-hidden items-center justify-center">
          <div className={`relative flex items-center justify-center shrink-0 w-full transition-all duration-700 h-full`}>

            {appState === 'idle' ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative min-h-[300px]">
                {/* Floating Dust Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(15)].map((_, i) => {
                    const left = `${15 + (i * 7) % 70}%`;
                    const top = `${20 + (i * 9) % 60}%`;
                    const duration = `${5 + (i * 3) % 8}s`;
                    const delay = `${-(i * 1.5) % 8}s`;
                    const drift = `${-30 + (i * 13) % 60}px`;
                    const size = `${2 + (i % 3)}px`;
                    return (
                      <div
                        key={i}
                        className="absolute floating-particle bg-blue-400/30 rounded-full blur-[0.5px]"
                        style={{
                          left,
                          top,
                          width: size,
                          height: size,
                          '--duration': duration,
                          '--drift': drift,
                          animationDelay: delay,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>

                {/* Concentric Rotating Orbits and Neural Net */}
                <div className="w-[280px] h-[280px] relative flex items-center justify-center">
                  <svg className="absolute w-full h-full" viewBox="0 0 300 300" fill="none">
                    {/* Definitions for Gradients */}
                    <defs>
                      <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                      </radialGradient>
                      <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>

                    {/* Concentric Orbits */}
                    <circle cx="150" cy="150" r="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <circle cx="150" cy="150" r="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 8" />
                    <circle cx="150" cy="150" r="45" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                    {/* Rotating Orbit Dash Rings */}
                    <g className="orbit-rotating-cw" style={{ transformOrigin: '150px 150px', '--speed': '25s' } as React.CSSProperties}>
                      <circle cx="150" cy="150" r="75" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="1.5" strokeDasharray="10 40 80 50" />
                    </g>
                    <g className="orbit-rotating-ccw" style={{ transformOrigin: '150px 150px', '--speed': '18s' } as React.CSSProperties}>
                      <circle cx="150" cy="150" r="110" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="1" strokeDasharray="20 60 40 30" />
                    </g>

                    {/* Neural Connection Lines */}
                    <line x1="150" y1="150" x2="150" y2="40" stroke="url(#line-grad)" strokeWidth="1" />
                    <line x1="150" y1="150" x2="260" y2="150" stroke="url(#line-grad)" strokeWidth="1" />
                    <line x1="150" y1="150" x2="150" y2="260" stroke="url(#line-grad)" strokeWidth="1" />
                    <line x1="150" y1="150" x2="40" y2="150" stroke="url(#line-grad)" strokeWidth="1" />

                    {/* Flow Dashed Lines */}
                    <line x1="150" y1="40" x2="150" y2="150" className="flow-dashed-line stroke-[#0ea5e9]/40" strokeWidth="1.5" />
                    <line x1="150" y1="150" x2="260" y2="150" className="flow-dashed-line stroke-[#a855f7]/40" strokeWidth="1.5" />
                    <line x1="150" y1="260" x2="150" y2="150" className="flow-dashed-line stroke-[#0ea5e9]/40" strokeWidth="1.5" />
                    <line x1="150" y1="150" x2="40" y2="150" className="flow-dashed-line stroke-[#a855f7]/40" strokeWidth="1.5" />

                    {/* Outer Nodes (Pools & Sources) */}
                    {/* Cetus (Top) */}
                    <circle cx="150" cy="40" r="6" fill="#030008" stroke="#0ea5e9" strokeWidth="1.5" />
                    <circle cx="150" cy="40" r="10" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.3" className="animate-ping" style={{ transformOrigin: '150px 40px' }} />

                    {/* Turbos (Right) */}
                    <circle cx="260" cy="150" r="6" fill="#030008" stroke="#a855f7" strokeWidth="1.5" />

                    {/* Kriya (Bottom) */}
                    <circle cx="150" cy="260" r="6" fill="#030008" stroke="#0ea5e9" strokeWidth="1.5" />

                    {/* DeepBook (Left) */}
                    <circle cx="40" cy="150" r="6" fill="#030008" stroke="#a855f7" strokeWidth="1.5" />
                  </svg>

                  {/* Pulsing Neural Core (Middle) */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0ea5e9]/30 to-[#a855f7]/30 border border-[#0ea5e9]/40 flex items-center justify-center z-10 neural-node-pulsing relative">
                    <div className="absolute inset-0 bg-[#0ea5e9]/10 rounded-full blur-[8px] animate-pulse"></div>
                    <span className="material-symbols-outlined text-[20px] text-white z-10 animate-pulse">psychology</span>
                  </div>

                  {/* Network Labels */}
                  <div className="absolute top-[12px] font-mono text-[8px] uppercase tracking-widest text-[#0ea5e9] bg-[#0ea5e9]/10 px-1.5 py-0.5 rounded border border-[#0ea5e9]/20 backdrop-blur-sm">Cetus</div>
                  <div className="absolute right-[-10px] font-mono text-[8px] uppercase tracking-widest text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded border border-[#a855f7]/20 backdrop-blur-sm">Turbos</div>
                  <div className="absolute bottom-[12px] font-mono text-[8px] uppercase tracking-widest text-[#0ea5e9] bg-[#0ea5e9]/10 px-1.5 py-0.5 rounded border border-[#0ea5e9]/20 backdrop-blur-sm">Kriya</div>
                  <div className="absolute left-[-15px] font-mono text-[8px] uppercase tracking-widest text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded border border-[#a855f7]/20 backdrop-blur-sm">DeepBook</div>
                </div>

                <div className="mt-6 text-[#888] font-mono text-center max-w-[280px] uppercase tracking-widest text-[9px] leading-relaxed bg-black/40 border border-white/5 rounded-lg py-2.5 px-4 backdrop-blur-sm z-10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <span className="text-[#0ea5e9] animate-pulse">●</span> Awaiting user intent to calculate optimal route...
                </div>
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
                    <path className={`animate-[dash_30s_linear_infinite] ${executionState === 'executing' ? 'stroke-[#a855f7] opacity-80' : 'stroke-white/20'}`} d="M 50 100 Q 120 50 200 50 T 350 100" fill="none" strokeDasharray="6 6" strokeWidth="2" strokeLinecap="round"></path>
                    {/* Lower curve */}
                    <path className={`animate-[dash_30s_linear_infinite] ${executionState === 'executing' ? 'stroke-[#a855f7] opacity-80' : 'stroke-white/20'}`} d="M 50 100 Q 120 150 200 150 T 350 100" fill="none" strokeDasharray="6 6" strokeWidth="2" strokeLinecap="round"></path>
                  </svg>
                </div>

                {/* Nodes */}
                <div className="flex justify-between items-center w-full relative z-10 transition-opacity duration-1000 opacity-100 xl:px-4 scale-[0.7] sm:scale-[0.8] lg:scale-[0.75] xl:scale-[0.85] shrink-0 origin-center">

                  {/* Origin Node */}
                  <div ref={sourceRef} className="flex flex-col items-center gap-2 z-20">
                    <div
                      onClick={() => setTokenModalMode('source')}
                      className={`w-12 h-12 rounded-full flex items-center justify-center relative group cursor-pointer hover:border-[#a855f7] transition-all overflow-hidden bg-[#111111] border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.15)] ${executionState === 'success' ? 'border-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.4)]' : ''}`}
                    >
                      <div className={`absolute inset-0 rounded-full border border-[#a855f7]/50 opacity-0 group-hover:opacity-100 transition-opacity ${executionState === 'executing' ? 'animate-ping opacity-50' : ''}`}></div>
                      {getTokenInfo(sourceToken)?.logoUrl ? (
                        <img src={getTokenInfo(sourceToken)?.logoUrl} alt={sourceToken} className="w-8 h-8 object-contain relative z-10" />
                      ) : (
                        <span className="font-display font-medium text-[14px] text-white relative z-10 tracking-widest">{sourceToken.slice(0, 4)}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-[9px] uppercase text-[#888] font-medium tracking-widest mb-1">Input</div>
                      <div className="font-body text-[13px] font-semibold text-white">{!isNaN(parseFloat(amount)) ? parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}</div>
                    </div>
                  </div>

                  {/* Intermediary Nodes (Pools) */}
                  <div className="flex flex-col gap-2 flex-1 mx-2 max-w-[200px] z-20 shrink-0">
                    {routeNodes.length > 0 ? routeNodes.map((node, index) => (
                      <div key={index} className={`flex items-center gap-2 bg-[#0a0416] p-2 rounded-[24px] border border-white/5 opacity-90 hover:opacity-100 hover:border-white/10 transition-all cursor-pointer ${executionState === 'executing' ? 'animate-pulse border-[#a855f7]/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : ''}`}>
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
                      <div className={`flex items-center gap-2 bg-[#0a0416] p-2 rounded-[24px] border border-white/5 opacity-90 hover:opacity-100 hover:border-white/10 transition-all cursor-pointer ${executionState === 'executing' ? 'animate-pulse border-[#a855f7]/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : ''}`}>
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
                  <div ref={destRef} className="flex flex-col items-center gap-2 z-20">
                    <div
                      onClick={() => setTokenModalMode('dest')}
                      className={`w-12 h-12 rounded-full flex items-center justify-center relative group cursor-pointer hover:border-[#a855f7]/50 transition-all bg-[#111111] border-dashed border-white/20 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] ${executionState === 'success' ? 'border-solid border-[#a855f7] bg-[#a855f7]/10 shadow-[0_0_40px_rgba(168,85,247,0.5)]' : ''}`}
                    >
                      {getTokenInfo(destToken)?.logoUrl ? (
                        <img src={getTokenInfo(destToken)?.logoUrl} alt={destToken} className="w-8 h-8 object-contain relative z-10" />
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
              <div className="font-mono text-[14px] text-white font-medium tracking-wider">{appState === 'done' ? (slippage.includes('%') ? slippage : `${slippage}%`) : '...'}</div>
            </div>
          </div>

          {executionState === 'success' ? (
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] text-green-400 font-bold tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> SUCCESS
              </span>
              <a href={`https://suivision.xyz/txblock/${txHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-[#888] hover:text-[#a855f7] transition-colors flex items-center gap-1 mt-1 underline underline-offset-2 break-all">
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
                    className="w-3 h-3 rounded border-white/20 bg-black/50 text-[#a855f7] focus:ring-[#a855f7]/50 transition-colors"
                  />
                  <span className="font-mono text-[9px] text-[#888] uppercase tracking-wider">Confirm PTB & Risks</span>
                </label>
              )}
              <button
                onClick={handleExecute}
                className={`px-6 py-2.5 rounded-[12px] font-mono text-[12px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center min-w-[180px] ${appState === 'done' &&
                    executionState === 'idle' &&
                    (!walletAddress || (!isInsufficientBalance && hasConfirmedSettings))
                    ? (!isSafe ? 'bg-red-500 text-white hover:bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-[#a855f7] text-white hover:bg-[#b87cff] shadow-[0_0_20px_rgba(168,85,247,0.3)]')
                    : 'bg-[#111111] border border-white/5 text-white/50 cursor-not-allowed'
                  }`}
                disabled={
                  appState !== 'done' ||
                  executionState === 'executing' ||
                  (walletAddress && (isInsufficientBalance || !hasConfirmedSettings))
                }
              >
                {appState !== 'done'
                  ? 'Awaiting Route'
                  : !walletAddress
                    ? 'Connect Wallet'
                    : isInsufficientBalance
                      ? `Insufficient ${sourceToken}`
                      : executionState === 'executing'
                        ? <div className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[14px] animate-spin">sync</span><span>Executing...</span></div>
                        : (!isSafe ? 'Execute With Risk' : 'Execute Swap')}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
