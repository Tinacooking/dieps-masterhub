import React, { useRef, useEffect } from 'react';
import { ConnectModal } from '@mysten/dapp-kit-react/ui';

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
  const modalRef = useRef<any>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const handleClose = () => {
      setIsWalletModalOpen(false);
    };

    modal.addEventListener('close', handleClose);
    modal.addEventListener('closed', handleClose);
    modal.addEventListener('cancel', handleClose);

    return () => {
      modal.removeEventListener('close', handleClose);
      modal.removeEventListener('closed', handleClose);
      modal.removeEventListener('cancel', handleClose);
    };
  }, [setIsWalletModalOpen]);

  return (
    <div className="flex justify-between items-end mb-2 border-b border-white/5 pb-4 relative shrink-0">
      <div className="absolute right-0 bottom-0 w-[400px] h-[100px] bg-[#a855f7]/10 blur-[80px] rounded-full pointer-events-none"></div>
      <div>
        <h2 className="text-[28px] md:text-[32px] font-serif italic font-light text-white mb-1 leading-none tracking-tight">Protocol Interface</h2>
        <p className="text-[#8F8F8F] font-mono text-[10px] uppercase tracking-widest">v2.0 Neural Engine</p>
      </div>
      <div className="flex gap-4">
        {!walletAddress ? (
          <>
            <button onClick={() => setIsWalletModalOpen(true)} className="button">
              <span className="fold"></span>
              <div className="points_wrapper">
                <div className="point"></div>
                <div className="point"></div>
                <div className="point"></div>
                <div className="point"></div>
                <div className="point"></div>
                <div className="point"></div>
                <div className="point"></div>
                <div className="point"></div>
                <div className="point"></div>
                <div className="point"></div>
              </div>
              <span className="inner">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                  <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
                  <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6Z" />
                </svg>
                Connect Wallet
              </span>
            </button>
            <ConnectModal
              ref={modalRef}
              open={isWalletModalOpen}
            />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10b981]/5 border border-[#10b981]/20 backdrop-blur-sm">
              <span className="sync-dot"></span>
              <span className="font-mono text-[9px] text-[#10b981] font-bold tracking-widest">SUI MAINNET • ACTIVE</span>
            </div>
            <button
              onClick={disconnect}
              className="px-5 py-2.5 rounded-xl border font-mono text-[12px] font-bold bg-[#a855f7]/10 border-[#a855f7]/30 text-white hover:bg-[#a855f7]/20 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.05)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              title="Click to disconnect"
            >
              {walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
