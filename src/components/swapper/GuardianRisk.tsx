import React from 'react';

interface GuardianRiskProps {
  processStep: number;
  guardianChecks?: any[];
  isSafe?: boolean;
}

export const GuardianRisk: React.FC<GuardianRiskProps> = ({ processStep, guardianChecks = [], isSafe = true }) => {
  const getRiskWeight = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DANGER': return 3;
      case 'WARNING': return 2;
      case 'SAFE': return 1;
      default: return 0;
    }
  };

  const sortedChecks = [...guardianChecks].sort((a, b) => getRiskWeight(b.status) - getRiskWeight(a.status));

  return (
    <div className={`bg-[#0a0416]/90 border ${isSafe ? 'border-white/5' : 'border-red-500/50'} rounded-[20px] p-4 flex flex-col gap-3 relative overflow-hidden h-fit shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)]`}>
      <div className="font-mono text-[10px] text-white uppercase tracking-widest flex items-center gap-2 relative z-10 font-bold mb-1">
        <span className="material-symbols-outlined text-[14px]">security</span> GUARDIAN RISK CLASS
        {processStep === 3 && <span className="material-symbols-outlined text-[14px] animate-spin ml-auto opacity-50">sync</span>}
        {!isSafe && <span className="text-red-400 ml-auto">EXECUTION BLOCKED</span>}
      </div>

      <div className="space-y-2 relative z-10 w-full flex flex-col max-h-[250px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#a855f7 #111111' }}>
        {sortedChecks.map((check, i) => (
          <div key={i} className={`flex flex-col gap-2 p-2.5 rounded-lg bg-[#0d0d0d] border ${check.status === 'DANGER' ? 'border-red-500/30' : check.status === 'WARNING' ? 'border-yellow-500/30' : 'border-white/5'} w-full`}>
            <div className="flex items-center justify-between">
              <span className="font-body text-[11px] text-[#e5e5e5] font-semibold tracking-wide">{check.name}</span>
              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded tracking-widest uppercase ${
                check.status === 'DANGER' ? 'text-red-400 bg-red-400/10' :
                check.status === 'WARNING' ? 'text-yellow-400 bg-yellow-400/10' :
                'text-[#00FF66] bg-[#00FF66]/10'
              }`}>
                {check.status}
              </span>
            </div>
            <span className={`font-body text-[10px] leading-relaxed ${check.status === 'DANGER' ? 'text-red-300' : check.status === 'WARNING' ? 'text-yellow-200' : 'text-[#888]'}`}>
              {check.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
