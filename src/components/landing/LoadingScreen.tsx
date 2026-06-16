import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface LoadingScreenProps {
  onComplete: () => void;
  mode?: 'landing' | 'app';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, mode = 'landing' }) => {
  const [pct, setPct] = useState(0);
  const [statusText, setStatusText] = useState(mode === 'landing' ? "INITIALIZING INTENT ENGINE..." : "CONNECTING TO SUI MAINNET...");
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obj = { val: 0 };

    // Timeline to count and then sweep
    const tl = gsap.timeline({
      onComplete: () => {
        // Sweep timeline to clear elements and slide up overlay
        const sweepTl = gsap.timeline({
          onComplete: onComplete
        });

        sweepTl.to([infoRef.current, barRef.current?.parentElement, statusRef.current], {
          opacity: 0,
          y: -30,
          duration: 0.6,
          ease: 'power3.in',
          stagger: 0.1
        })
          .to(containerRef.current, {
            yPercent: -100,
            duration: 1.4,
            ease: 'power4.inOut'
          }, '-=0.2');
      }
    });

    tl.to(obj, {
      val: 100,
      duration: mode === 'landing' ? 3.2 : 1.8,
      ease: mode === 'landing' ? 'power2.inOut' : 'power1.inOut',
      onUpdate: () => {
        const rounded = Math.floor(obj.val);
        setPct(rounded);

        if (barRef.current) {
          gsap.set(barRef.current, { scaleX: obj.val / 100 });
        }

        if (mode === 'landing') {
          if (rounded <= 25) setStatusText("INITIALIZING INTENT ENGINE...");
          else if (rounded <= 50) setStatusText("MAPPING SUI DECENTRALIZED POOLS...");
          else if (rounded <= 75) setStatusText("CALCULATING GUARDIAN RISK...");
          else if (rounded <= 95) setStatusText("COMPILING NEURAL PATHWAYS...");
          else setStatusText("CONNECTION SECURE");
        } else {
          // App mode texts
          if (rounded <= 30) setStatusText("CONNECTING TO SUI MAINNET...");
          else if (rounded <= 60) setStatusText("SYNCING WALLET STATE...");
          else if (rounded <= 90) setStatusText("INITIALIZING INTENT PARSER...");
          else setStatusText("INTERFACE READY");
        }
      }
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#030008] z-[9999] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Starry background sky */}
      <div className="absolute inset-0 stars-bg opacity-30 z-0 pointer-events-none" />

      {/* Floating purple glow background light */}
      <div className="absolute w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="flex flex-col items-center z-10 select-none">
        {/* Percentage Counter */}
        <div
          ref={infoRef}
          className="flex flex-col items-center"
        >
          <span className="font-sans text-[10px] text-white/30 tracking-[0.4em] uppercase mb-4">
            {mode === 'landing' ? "SYSTEM BOOTING" : "DAPP INITIALIZATION"}
          </span>
          <h1 className="font-serif italic font-light text-[80px] sm:text-[110px] md:text-[130px] text-white tracking-tight leading-none">
            {pct.toString().padStart(2, '0')}%
          </h1>
        </div>

        {/* Loading Bar */}
        <div className="w-[280px] sm:w-[340px] h-[1px] bg-white/10 rounded-full relative mt-8 overflow-hidden">
          <div
            ref={barRef}
            className="absolute top-0 left-0 h-full w-full bg-[#a855f7] shadow-[0_0_12px_#a855f7] origin-left scale-x-0"
          />
        </div>

        {/* Dynamic Captions */}
        <div
          ref={statusRef}
          className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#a855f7] mt-4 h-[20px] text-center w-[300px] sm:w-[400px]"
        >
          {statusText}
        </div>
      </div>
    </div>
  );
};
