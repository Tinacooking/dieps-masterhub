import React from 'react';

interface IntentChatProps {
  intentInput: string;
  setIntentInput: (val: string) => void;
  appState: 'idle' | 'processing' | 'done';
  processStep: number;
  submittedIntent: string;
  amount: string;
  sourceToken: string;
  destToken: string;
  handleSimulate: (e: React.FormEvent) => void;
}

export const IntentChat: React.FC<IntentChatProps> = ({
  intentInput,
  setIntentInput,
  appState,
  processStep,
  submittedIntent,
  amount,
  sourceToken,
  destToken,
  handleSimulate
}) => {
  return (
    <div className="lg:col-span-4 xl:col-span-4 flex flex-col h-full min-h-0">
      <div className="rounded-[20px] p-4 lg:p-5 flex-1 min-h-0 flex flex-col relative overflow-hidden bg-[#0a0416]/90 border border-white/5 disabled-text-selection shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <div className="flex-1 overflow-y-auto space-y-5 lg:space-y-6 pr-2 custom-scrollbar flex flex-col relative z-10 pb-4">

          {/* System Message */}
          <div className="flex flex-col items-start gap-3">
            <div className="font-mono text-[9px] text-[#0ea5e9] flex items-center gap-2 font-bold tracking-widest uppercase bg-[#0ea5e9]/10 px-2.5 py-1 rounded-full border border-[#0ea5e9]/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse"></span>
              Neural Interface Active
            </div>
            <div className="bg-[#0c061a]/60 border border-[#1e1b4b]/50 backdrop-blur-md rounded-2xl p-4 lg:p-5 max-w-[100%] xl:max-w-[90%] relative overflow-hidden shadow-[inset_0_0_15px_rgba(14,165,233,0.05)]">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0ea5e9]/50"></div>
              <p className="font-body text-[#e2e8f0] leading-relaxed text-[13px] xl:text-[14px]">
                Welcome. I am the DIEPS Router intelligence agent. Describe your trading goal in natural language, and I will optimize and execute your swap transaction in real-time.
              </p>
            </div>
          </div>

          {appState !== 'idle' && (
            <>
              {/* User Intent */}
              <div className="flex flex-col items-end gap-2 mt-2">
                <div className="font-mono text-[9px] text-[#a855f7] font-bold tracking-widest uppercase pr-1 flex items-center gap-1.5">
                  User Intent <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"></span>
                </div>
                <div className="bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-2xl p-4 max-w-[90%] relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.05)]">
                  <p className="font-body text-[#f1f5f9] text-[13px] xl:text-[14px] leading-relaxed relative z-10">{submittedIntent}</p>
                </div>
              </div>

              {/* System Processing */}
              <div className="flex flex-col items-start gap-3 mt-4 w-full">
                <div className="font-mono text-[9px] text-[#00ff66] flex items-center gap-2 font-bold tracking-widest uppercase bg-[#00ff66]/10 px-2.5 py-1 rounded-full border border-[#00ff66]/20">
                  <span className={`w-1.5 h-1.5 rounded-full bg-[#00ff66] ${appState === 'processing' ? 'animate-ping' : ''}`}></span>
                  Calculated Route Optimization
                </div>
                <div className="bg-[#0c061a]/60 border border-[#1e1b4b]/50 backdrop-blur-md rounded-2xl p-4 lg:p-5 w-full relative overflow-hidden shadow-[inset_0_0_15px_rgba(168,85,247,0.03)]">
                  <div className={`absolute top-0 left-0 w-1 h-full ${processStep >= 2 ? 'bg-[#00ff66]/50' : 'bg-[#0ea5e9]/50 animate-pulse'}`}></div>
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase mb-4 pl-2">
                    {appState === 'processing' && processStep < 2 ? (
                      <div className="flex gap-1 opacity-80">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] opacity-90 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]/50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]/20 animate-pulse" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00ff66]"></div>
                    )}
                    <span className="text-[#888]">
                      {appState === 'processing' && processStep < 2 ? 'DECODING INTENT...' : 'ROUTE FORMULATED'}
                    </span>
                  </div>

                  {processStep >= 1 && (
                    <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-8 gap-y-5 font-mono text-[10px] uppercase tracking-widest transition-opacity duration-500 opacity-100 pl-2">
                      <div className="text-[#666] font-bold">Action</div>
                      <div className="text-[#0ea5e9] font-bold">Swap</div>
                      <div className="text-[#666] font-bold">Amount</div>
                      <div className="text-[#e5e5e5] font-bold">{amount}</div>

                      <div className="text-[#666] font-bold">From</div>
                      <div className="text-[#f1f5f9] font-bold">{sourceToken}</div>
                      <div className="text-[#666] font-bold">To</div>
                      <div className="text-[#f1f5f9] font-bold">{destToken}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="h-4 shrink-0"></div>
        </div>

        {/* Input Area */}
        <div className="pt-3 mt-auto border-t border-white/5 relative z-10 w-full shrink-0 flex flex-col gap-2.5">
          <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1.5">
            <button type="button" disabled={appState === 'processing'} onClick={() => setIntentInput("Swap 1000 SUI to USDC")} className="whitespace-nowrap px-3.5 py-2 rounded-[12px] command-tag text-[#0ea5e9] text-[10px] sm:text-[11px] font-mono tracking-wide transition-all duration-200 disabled:opacity-50 cursor-pointer">
              <span className="text-[#a855f7]/60 mr-1">&gt;</span> Swap 1000 SUI to USDC
            </button>
            <button type="button" disabled={appState === 'processing'} onClick={() => setIntentInput("Exchange 500 CETUS for SUI")} className="whitespace-nowrap px-3.5 py-2 rounded-[12px] command-tag text-[#0ea5e9] text-[10px] sm:text-[11px] font-mono tracking-wide transition-all duration-200 disabled:opacity-50 cursor-pointer">
              <span className="text-[#a855f7]/60 mr-1">&gt;</span> Exchange 500 CETUS
            </button>
            <button type="button" disabled={appState === 'processing'} onClick={() => setIntentInput("Convert 100 NAVX to TURBOS")} className="whitespace-nowrap px-3.5 py-2 rounded-[12px] command-tag text-[#0ea5e9] text-[10px] sm:text-[11px] font-mono tracking-wide transition-all duration-200 disabled:opacity-50 cursor-pointer">
              <span className="text-[#a855f7]/60 mr-1">&gt;</span> Convert 100 NAVX
            </button>
          </div>
          <form onSubmit={handleSimulate} className="relative w-full">
            <div className="bg-[#0c061a]/80 border border-white/10 rounded-full flex items-center justify-between p-1.5 focus-within:border-[#0ea5e9]/50 transition-colors focus-within:bg-[#110c26]/90 shadow-[0_0_15px_rgba(14,165,233,0.05)]">
              <input 
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-[13px] font-body text-white w-full pl-5 pr-3 placeholder-[#555]" 
                placeholder="e.g., Swap 1000 SUI to USDC..." 
                type="text" 
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                disabled={appState === 'processing'}
              />
              <button type="submit" disabled={appState === 'processing' || !intentInput.trim()} className="w-9 h-9 rounded-full send-energy-btn text-white transition-all duration-200 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px] font-medium text-white">send</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
