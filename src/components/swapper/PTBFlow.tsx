import React from 'react';

interface PTBFlowProps {
  processStep: number;
  ptbSteps?: any[];
  amount: string;
  sourceToken: string;
}

export const PTBFlow: React.FC<PTBFlowProps> = ({
  processStep,
  ptbSteps = [],
  amount,
  sourceToken
}) => {
  return (
    <div className="bg-[#0a0416]/90 border border-white/5 rounded-[20px] p-4 flex flex-col gap-3 relative overflow-hidden flex-1 min-h-0 w-full lg:mb-0 mb-4 xl:mb-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div className="absolute top-[20px] left-0 w-1 h-[calc(100%-40px)] bg-[#a855f7]"></div>

      <div className="font-mono text-[10px] text-white uppercase tracking-widest flex items-center gap-2 relative z-10 font-bold pl-2 shrink-0">
        <span className="material-symbols-outlined text-[14px] rotate-90">account_tree</span> EXECUTION FLOW
        {processStep === 3 && <span className="material-symbols-outlined text-[14px] animate-spin ml-auto opacity-50">sync</span>}
      </div>

      <div className="text-[9px] text-[#888] space-y-2 overflow-y-auto custom-scrollbar flex-1 pl-3 font-mono pb-2">
        {ptbSteps && ptbSteps.length > 0 ? ptbSteps.map((step, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-white/20 shrink-0 font-bold mt-0.5">{step.index}</span>
            <div className="leading-relaxed whitespace-pre-wrap font-medium">
              <span className={step.command === 'SplitCoins' ? 'text-blue-400' : step.command === 'TransferObjects' ? 'text-green-400' : 'text-[#a855f7]'}>{step.command}</span>
              <br /><span className="text-[#888]">{step.target || ''}</span>
              <br /><span className={step.command === 'TransferObjects' ? 'text-[#ddd]' : 'text-orange-300'}>{step.description}</span>
            </div>
          </div>
        )) : (
          <div className="flex gap-2 items-start">
            <span className="text-white/20 shrink-0 font-bold mt-0.5 animate-pulse">...</span>
            <div className="leading-relaxed whitespace-pre-wrap font-medium">
              <span className="text-[#888]">Formulating Programmable Transaction Block...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
