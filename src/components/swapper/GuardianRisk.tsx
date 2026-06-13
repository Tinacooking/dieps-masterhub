import React from 'react';

interface GuardianRiskProps {
  processStep: number;
  warnings?: string[];
}

export const GuardianRisk: React.FC<GuardianRiskProps> = ({ processStep, warnings = [] }) => {
  return (
    <div className="bg-[#0a0416]/90 border border-white/5 rounded-[20px] p-4 flex flex-col gap-3 relative overflow-hidden h-fit shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"> 	
      <div className="font-mono text-[10px] text-white uppercase tracking-widest flex items-center gap-2 relative z-10 font-bold mb-1">
        <span className="material-symbols-outlined text-[14px]">security</span> GUARDIAN RISK CLASS
        {processStep === 3 && <span className="material-symbols-outlined text-[14px] animate-spin ml-auto opacity-50">sync</span>}
      </div>

      <div className="space-y-2 relative z-10 w-full flex flex-col">
        {warnings.length === 0 ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0d0d0d] border border-white/5 w-full">
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-[10px] text-[#e5e5e5] font-medium tracking-wide">Overall Status</span>
              </div>
              <span className="font-mono text-[8px] text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded tracking-widest uppercase">Safe</span>
          </div>
        ) : (
          warnings.map((warning, idx) => {
            const isDanger = warning.includes('🚨') || warning.includes('CRITICAL');
            const colorClass = isDanger ? 'text-[#ff4444] bg-[#ff4444]/10' : 'text-[#FFC107] bg-[#FFC107]/10';
            const label = isDanger ? 'Danger' : 'Warning';
            
            return (
              <div key={idx} className="flex flex-col p-2 rounded-lg bg-[#0d0d0d] border border-white/5 w-full gap-1.5">
                <div className="flex items-center justify-between w-full">
                  <span className="font-body text-[10px] text-[#e5e5e5] font-medium tracking-wide line-clamp-1">{warning.split(':')[0]}</span>
                  <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded tracking-widest uppercase ${colorClass}`}>{label}</span>
                </div>
                <span className="font-mono text-[8.5px] text-[#888] leading-tight break-words">{warning.split(':').slice(1).join(':').trim() || warning}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
