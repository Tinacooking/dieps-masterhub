import React from 'react';

interface PTBFlowProps {
  processStep: number;
  routeNodes: any[];
  amount: string;
  sourceToken: string;
}

export const PTBFlow: React.FC<PTBFlowProps> = ({
  processStep,
  routeNodes,
  amount,
  sourceToken
}) => {
  return (
    <div className="bg-[#0a0416]/90 border border-white/5 rounded-[20px] p-4 flex flex-col gap-3 relative overflow-hidden flex-1 min-h-0 w-full lg:mb-0 mb-4 xl:mb-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div className="absolute top-[20px] left-0 w-1 h-[calc(100%-40px)] bg-[#a855f7]"></div>
      
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
                <span className="text-[#a855f7]">MoveCall</span> <br/><span className="text-[#888]">{node.dex.toLowerCase()}::swap::exact_in</span> <br/><span className="text-orange-300">Coin{i}</span>
              </div>
            </div>
        )) : (
            <div className="flex gap-2 items-start">
              <span className="text-white/20 shrink-0 font-bold mt-0.5">2</span>
              <div className="leading-relaxed whitespace-pre-wrap font-medium">
                <span className="text-[#a855f7]">MoveCall</span> <br/><span className="text-[#888]">cetus::swap::exact_in</span> <br/><span className="text-orange-300">Coin0</span>
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
  );
};
