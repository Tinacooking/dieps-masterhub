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
    <div className="flex flex-col flex-1 h-full min-h-0 relative group">
      {/* Dynamic Ambient Outer Glow behind the chat panel */}
      <div className="absolute -inset-1 bg-gradient-to-br from-[#a855f7]/15 via-[#0ea5e9]/10 to-[#a855f7]/15 rounded-[22px] blur-md opacity-90 transition-opacity duration-500 pointer-events-none group-hover:opacity-100"></div>

      <div className="rounded-[20px] p-4 lg:p-5 flex-1 min-h-0 flex flex-col relative overflow-hidden bg-[#13092d]/85 border-[1.5px] border-[#a855f7]/30 disabled-text-selection shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(168,85,247,0.08)] backdrop-blur-xl chat-panel-active z-10">
        <div className="flex-1 overflow-y-auto space-y-5 lg:space-y-6 pr-2 custom-scrollbar flex flex-col relative z-10 pb-4">

          {/* System Message */}
          <div className="flex flex-col items-start gap-3">
            <div className="font-mono text-[9px] text-[#0ea5e9] flex items-center gap-2 font-bold tracking-widest uppercase bg-[#0ea5e9]/15 px-3 py-1.5 rounded-full border border-[#0ea5e9]/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse"></span>
              Neural Interface Active
            </div>
            <div className="bg-[#1c0f3a]/90 border-[1.5px] border-[#a855f7]/35 backdrop-blur-md rounded-2xl rounded-tl-none p-4 lg:p-5 max-w-[100%] xl:max-w-[92%] relative overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#0ea5e9] to-[#a855f7]"></div>
              <p className="font-body text-[#f1f5f9] leading-relaxed text-[13px] xl:text-[14px]">
                Welcome. I am the <span className="text-[#a855f7] font-semibold">DIEPS</span> intelligence agent. Describe your trading goal in natural language, and I will optimize and execute your swap transaction in real-time.
              </p>
            </div>
          </div>

          {appState !== 'idle' && (
            <>
              {/* User Intent */}
              <div className="flex flex-col items-end gap-2 mt-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="font-mono text-[9px] text-[#c084fc] font-bold tracking-widest uppercase pr-1 flex items-center gap-1.5">
                  User Intent <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]"></span>
                </div>
                <div className="bg-white border-[1.5px] border-white rounded-2xl rounded-tr-none p-4 max-w-[90%] relative overflow-hidden shadow-[0_10px_25px_rgba(168,85,247,0.25)] transition-all duration-300">
                  <p className="font-body text-[#1b083c] text-[13px] xl:text-[14px] leading-relaxed relative z-10 font-semibold">{submittedIntent}</p>
                </div>
              </div>

              {/* System Processing */}
              <div className="flex flex-col items-start gap-3 mt-4 w-full">
                <div className="font-mono text-[9px] text-[#00ff66] flex items-center gap-2 font-bold tracking-widest uppercase bg-[#00ff66]/15 px-3 py-1.5 rounded-full border border-[#00ff66]/30 shadow-[0_0_12px_rgba(0,255,102,0.15)]">
                  <span className={`w-1.5 h-1.5 rounded-full bg-[#00ff66] ${appState === 'processing' ? 'animate-ping' : ''}`}></span>
                  Calculated Route Optimization
                </div>
                <div className="bg-[#1c0f3a]/90 border-[1.5px] border-[#00ff66]/30 backdrop-blur-md rounded-2xl rounded-tl-none p-4 lg:p-5 w-full relative overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(0,255,102,0.05)]">
                  <div className={`absolute top-0 left-0 w-1 h-full ${processStep >= 2 ? 'bg-[#00ff66]/80' : 'bg-[#0ea5e9]/80 animate-pulse'}`}></div>
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
        <div className="pt-4 mt-auto border-t border-white/10 relative z-10 w-full shrink-0 flex flex-col gap-4">

          {/* AI Recommended Intents - Visual Grouping */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 px-1 font-mono text-[9px] text-[#38bdf8] uppercase tracking-wider font-bold">
              <span className="material-symbols-outlined text-[12px] animate-pulse">auto_awesome</span>
              ✨ Suggested Intents
            </div>

            <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
              <button
                type="button"
                disabled={appState === 'processing'}
                onClick={() => setIntentInput("Swap 1000 SUI to USDC")}
                className="whitespace-nowrap px-3.5 py-2 rounded-[12px] command-tag text-[10px] sm:text-[11px] font-mono tracking-wide transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[11px] text-[#38bdf8]/70">bolt</span>
                Swap 1000 SUI to USDC
              </button>
              <button
                type="button"
                disabled={appState === 'processing'}
                onClick={() => setIntentInput("Exchange 500 CETUS for SUI")}
                className="whitespace-nowrap px-3.5 py-2 rounded-[12px] command-tag text-[10px] sm:text-[11px] font-mono tracking-wide transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[11px] text-[#38bdf8]/70">bolt</span>
                Exchange 500 CETUS
              </button>
              <button
                type="button"
                disabled={appState === 'processing'}
                onClick={() => setIntentInput("Convert 100 NAVX to TURBOS")}
                className="whitespace-nowrap px-3.5 py-2 rounded-[12px] command-tag text-[10px] sm:text-[11px] font-mono tracking-wide transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[11px] text-[#38bdf8]/70">bolt</span>
                Convert 100 NAVX
              </button>
            </div>
          </div>

          <form onSubmit={handleSimulate} className="relative w-full">
            <div className="bg-[#1c0f3a]/80 border-[1.5px] border-[#a855f7]/30 rounded-full flex items-center justify-between p-1.5 focus-within:border-[#0ea5e9]/60 focus-within:ring-1 focus-within:ring-[#0ea5e9]/20 transition-all focus-within:bg-[#25154f]/90 shadow-[0_8px_25px_rgba(0,0,0,0.3),inset_0_0_10px_rgba(14,165,233,0.05)]">
              <input
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-[13px] font-body text-white w-full pl-5 pr-3 placeholder-[#8f8f8f]"
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
