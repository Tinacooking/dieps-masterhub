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
    <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-full min-h-0">
      <div className="rounded-[20px] p-4 lg:p-5 flex-1 min-h-0 flex flex-col relative overflow-hidden bg-[#0a0416]/90 border border-white/5 disabled-text-selection shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-5 pr-2 custom-scrollbar flex flex-col relative z-10 pb-4">

          {/* System Message */}
          <div className="flex flex-col items-start gap-3">
            <div className="font-mono text-[10px] text-[#8F8F8F] flex items-center gap-2 font-bold tracking-widest uppercase">
              <span className="material-symbols-outlined text-[14px]">psychology</span> Engine Ready
            </div>
            <div className="bg-[#111111] border border-white/5 rounded-xl p-4 lg:p-5 max-w-[100%] xl:max-w-[85%] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#a855f7]/40"></div>
              <p className="font-body text-[#e5e5e5] leading-relaxed text-[13px] xl:text-[14px]">How can I help you swap today? Try entering an amount and desired asset.</p>
            </div>
          </div>

          {appState !== 'idle' && (
            <>
              {/* User Intent */}
              <div className="flex flex-col items-end gap-2 mt-2">
                <div className="font-mono text-[10px] text-[#888] font-bold tracking-widest uppercase pr-1">User</div>
                <div className="bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-xl p-4 max-w-[90%] relative overflow-hidden">
                  <p className="font-body text-[#e5e5e5] text-[13px] xl:text-[14px] leading-relaxed relative z-10">{submittedIntent}</p>
                </div>
              </div>

              {/* System Processing */}
              <div className="flex flex-col items-start gap-3 mt-4 w-full">
                <div className="font-mono text-[10px] text-[#fff] flex items-center gap-2 font-bold tracking-widest uppercase">
                  <span className={`material-symbols-outlined text-[14px] ${appState === 'processing' ? 'animate-spin text-[#a855f7]' : 'text-[#00FF66]'}`}>sync</span> Calculating Route
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-xl p-4 lg:p-5 w-full relative overflow-hidden transition-all">
                  <div className={`absolute top-0 left-0 w-1 h-full ${processStep >= 2 ? 'bg-[#00FF66]/40' : 'bg-[#a855f7]/40 animate-pulse'}`}></div>
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase mb-4 pl-2">
                    {appState === 'processing' && processStep < 2 ? (
                      <div className="flex gap-1 opacity-80">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7] opacity-90 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]/50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]/20 animate-pulse" style={{ animationDelay: '400ms' }}></div>
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
            <div className="bg-[#111] border border-white/10 rounded-full flex items-center justify-between p-1 focus-within:border-[#a855f7]/50 transition-colors focus-within:bg-[#151515]">
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
  );
};
