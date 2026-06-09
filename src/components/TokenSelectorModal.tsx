import React, { useState, useMemo } from 'react';
import { TOKEN_LOGOS } from '../constants';
import { TokenLogo } from './TokenLogo';

export function TokenSelectorModal({ isOpen, onClose, onSelect, selectedToken }: { isOpen: boolean, onClose: () => void, onSelect: (token: string) => void, selectedToken: string }) {
  const [search, setSearch] = useState('');

  const filteredTokens = useMemo(() => {
    return Object.keys(TOKEN_LOGOS).filter(token => token.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#111] w-full max-w-[400px] rounded-[24px] p-6 border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative flex flex-col h-[600px] max-h-[80vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#888] hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h3 className="font-display text-[24px] text-white mb-4">Select Token</h3>
        
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#888] text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search token symbol..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/5 focus:border-[#9D6BFF]/50 rounded-[16px] py-4 pl-12 pr-4 text-white font-body text-[15px] outline-none transition-colors placeholder:text-[#666]"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-8 text-[#888] font-body">No tokens found.</div>
          ) : (
             filteredTokens.map(token => (
              <button 
                key={token}
                onClick={() => { onSelect(token); onClose(); setSearch(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-[16px] border transition-all ${selectedToken === token ? 'bg-[#9D6BFF]/10 border-[#9D6BFF]/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    <TokenLogo symbol={token} className="w-8 h-8" />
                  </div>
                  <span className="font-display font-medium text-white">{token}</span>
                </div>
                {selectedToken === token && <span className="material-symbols-outlined text-[#9D6BFF] text-[20px]">check</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
