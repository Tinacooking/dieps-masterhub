import React from 'react';
import { ConnectModal } from '@mysten/dapp-kit';

interface SwapperHeaderProps {
  walletAddress: string | null;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  disconnect: () => void;
}

export const SwapperHeader: React.FC<SwapperHeaderProps> = ({
  walletAddress,
  isWalletModalOpen,
  setIsWalletModalOpen,
  disconnect
}) => {
  return (
    <div className="flex justify-between items-end mb-2 border-b border-white/5 pb-4 relative shrink-0">
      <div className="absolute right-0 bottom-0 w-[400px] h-[100px] bg-[#a855f7]/10 blur-[80px] rounded-full pointer-events-none"></div>
      <div>
         <h2 className="text-[28px] md:text-[32px] font-serif italic font-light text-white mb-1 leading-none tracking-tight">Protocol Interface</h2>
         <p className="text-[#8F8F8F] font-mono text-[10px] uppercase tracking-widest">v2.0 Neural Engine</p>
      </div>
      <div className="flex gap-4">
        {!walletAddress ? (
          <ConnectModal
            open={isWalletModalOpen}
            onOpenChange={setIsWalletModalOpen}
            trigger={
              <button className="px-5 py-2.5 rounded-full border border-white/10 font-body text-[12px] font-medium hover:border-[#a855f7]/50 hover:bg-[#a855f7]/10 transition-colors backdrop-blur-xl cursor-pointer">
                Connect Wallet
              </button>
            }
          />
        ) : (
          <button 
            onClick={disconnect}
            className="px-5 py-2.5 rounded-full border font-body text-[12px] font-medium bg-[#a855f7]/10 border-[#a855f7]/30 text-white hover:bg-[#a855f7]/20 transition-colors cursor-pointer"
            title="Click to disconnect"
          >
            {walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)}
          </button>
        )}
      </div>
    </div>
  );
};
