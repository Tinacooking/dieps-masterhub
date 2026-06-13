import React from 'react';

interface PTBFlowProps {
  processStep: number;
  routeNodes: any[];
  amount: string;
  sourceToken: string;
  humanReadablePTB?: string;
}

export const PTBFlow: React.FC<PTBFlowProps> = ({
  processStep,
  routeNodes,
  amount,
  sourceToken,
  humanReadablePTB
}) => {
  const steps = humanReadablePTB ? humanReadablePTB.split('\n').filter(Boolean) : [];
  return (
    <div className="bg-[#0a0416]/90 border border-white/5 rounded-[20px] p-4 flex flex-col gap-3 relative overflow-hidden flex-1 min-h-0 w-full lg:mb-0 mb-4 xl:mb-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div className="absolute top-[20px] left-0 w-1 h-[calc(100%-40px)] bg-[#a855f7]"></div>
      
      <div className="font-mono text-[10px] text-white uppercase tracking-widest flex items-center gap-2 relative z-10 font-bold pl-2 shrink-0">
        <span className="material-symbols-outlined text-[14px] rotate-90">account_tree</span> PTB EXECUTION FLOW
        {processStep === 3 && <span className="material-symbols-outlined text-[14px] animate-spin ml-auto opacity-50">sync</span>}
      </div>

      <div className="text-[9px] text-[#888] space-y-2 overflow-y-auto custom-scrollbar flex-1 pl-3 font-mono pb-2">
        {steps.length > 0 ? (
          steps.map((step, idx) => {
            const isTransfer = step.includes('Transfer');
            const isSplit = step.includes('Split') || step.includes('Prepare');
            const colorClass = isTransfer ? 'text-green-400' : isSplit ? 'text-blue-400' : 'text-[#a855f7]';
            
            return (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-white/20 shrink-0 font-bold mt-0.5">{idx + 1}</span>
                <div className="leading-relaxed whitespace-pre-wrap font-medium">
                  <span className={colorClass}>{step.split(' ')[0]}</span> <br/>
                  <span className="text-[#ddd]">{step.substring(step.indexOf(' ') + 1)}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex gap-2 items-start">
            <span className="text-white/20 shrink-0 font-bold mt-0.5">1</span>
            <div className="leading-relaxed whitespace-pre-wrap font-medium">
              <span className="text-[#a855f7]">Waiting</span> <br/><span className="text-[#888]">for PTB construction...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
