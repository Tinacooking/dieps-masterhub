import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Info, HelpCircle } from 'lucide-react';
import workflowSvg from '../../assets/workflow-animation.svg';

export const MathAlgorithms = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const conceptRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = document.querySelector('.custom-scrollbar') as HTMLElement | null;
    const animatedRef = { current: false };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          gsap.fromTo(titleRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
          );
          gsap.fromTo(conceptRef.current,
            { opacity: 0, x: -30 },
            { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.2 }
          );
          gsap.fromTo(graphRef.current,
            { opacity: 0, x: 30 },
            { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.4 }
          );
          observer.unobserve(entry.target);
        }
      });
    }, { root: scrollContainer, threshold: 0.2 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => { observer.disconnect(); };
  }, []);

  return (
    <section
      ref={containerRef}
      className="w-full h-full px-8 md:px-24 bg-[#030008] relative z-10 flex flex-col justify-center py-12 lg:py-20 overflow-hidden"
    >
      {/* Background soft glow */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[140px] bg-[#a855f7]/5 -bottom-20 -left-20 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[140px] bg-purple-600/5 -top-20 -right-20 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto w-full flex-1 flex flex-col justify-center min-h-0">
        <h2
          ref={titleRef}
          className="text-[28px] md:text-[40px] font-serif italic font-light text-white mb-8 md:mb-12 text-center tracking-tight opacity-0 shrink-0"
        >
          DIEPS Mathematical Algorithms
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-0 shrink">
          {/* Left Column: Concept & Formula (5 Cols) */}
          <div
            ref={conceptRef}
            className="lg:col-span-5 flex flex-col gap-6 opacity-0"
          >
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-[#a855f7] tracking-widest uppercase font-bold">Optimal Path Formulation</span>
              <h3 className="text-[22px] md:text-[28px] text-white font-display">Routing Subgraph Concept</h3>
              <p className="text-[13px] md:text-[14px] text-white/50 leading-relaxed font-body">
                DIEPS normalizes fragmented liquidity pools across the Sui ecosystem into a directed graph. Each pool is represented as a directed edge with a penalty weight calculated dynamically using the formula below:
              </p>
            </div>

            {/* Formula Panel */}
            <div className="text-[12px] xs:text-[14px] sm:text-[17px] md:text-[19px] lg:text-[13px] xl:text-[16px] 2xl:text-[20px] text-purple-200 bg-[#0a0416] border border-white/5 rounded-2xl p-5 md:p-6 tracking-wide shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden group select-none">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#a855f7]/30 group-hover:bg-[#a855f7]/60 transition-colors" />
              <div className="w-full overflow-x-auto scrollbar-none text-center py-2 select-text">
                <div className="inline-flex items-baseline justify-center whitespace-nowrap font-serif tracking-wide text-white">
                  <span className="italic font-medium">W</span>
                  <span className="text-[0.65em] relative -bottom-[0.18em] ml-0.5 opacity-95">u,v</span>
                  <span className="mx-3 text-[#a855f7] font-medium">=</span>
                  <span className="font-medium">−log</span>
                  <span className="text-white/40 font-medium ml-1">(</span>
                  <span className="italic font-medium">R</span>
                  <span className="text-[0.65em] relative -bottom-[0.18em] ml-0.5 opacity-95">u,v</span>
                  <span className="mx-2.5 text-white/30 font-medium">×</span>
                  <span className="text-white/40 font-medium">(</span>
                  <span className="font-medium">1 −</span>
                  <span className="italic font-medium ml-1">F</span>
                  <span className="text-[0.65em] relative -bottom-[0.18em] ml-0.5 opacity-95">u,v</span>
                  <span className="text-white/40 font-medium">)</span>
                  <span className="mx-2.5 text-white/30 font-medium">×</span>
                  <span className="text-white/40 font-medium">(</span>
                  <span className="font-medium">1 −</span>
                  <span className="italic font-medium ml-1">S</span>
                  <span className="text-[0.65em] relative -bottom-[0.18em] ml-0.5 opacity-95">u,v</span>
                  <span className="text-white/40 font-medium">(</span>
                  <span className="italic font-medium">x</span>
                  <span className="text-white/40 font-medium">)))</span>
                </div>
              </div>
            </div>

            {/* Parameter Description Legend */}
            <div className="bg-[#0a0416]/40 border border-white/[0.03] rounded-xl p-4 md:p-5 flex flex-col gap-3.5">
              <div className="flex gap-3 items-start">
                <span className="font-mono text-[11px] text-purple-400 font-bold shrink-0 w-12 text-right">W_u,v</span>
                <p className="text-[12px] text-white/50 font-body leading-tight">
                  <span className="text-white/80 font-medium">Edge Weight:</span> Penalty index (minimized weight corresponds to optimal swap value).
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="font-mono text-[11px] text-purple-400 font-bold shrink-0 w-12 text-right">R_u,v</span>
                <p className="text-[12px] text-white/50 font-body leading-tight">
                  <span className="text-white/80 font-medium">Exchange Rate:</span> Spot exchange price of target token relative to input asset.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="font-mono text-[11px] text-purple-400 font-bold shrink-0 w-12 text-right">F_u,v</span>
                <p className="text-[12px] text-white/50 font-body leading-tight">
                  <span className="text-white/80 font-medium">Fee Rate:</span> Inherent pool fee multiplier configured by the decentralized exchange.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="font-mono text-[11px] text-purple-400 font-bold shrink-0 w-12 text-right">S_u,v(x)</span>
                <p className="text-[12px] text-white/50 font-body leading-tight">
                  <span className="text-white/80 font-medium">Slippage function:</span> Expected slippage penalty calculated against input trade size <span className="italic">x</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: SVG Visualization (7 Cols) */}
          <div
            ref={graphRef}
            className="lg:col-span-7 flex flex-col justify-center opacity-0 h-full min-h-0"
          >
            <div className="w-full flex items-center justify-center p-3 sm:p-5 rounded-[24px] lg:rounded-[32px] bg-[#0a0416]/60 border border-white/5 relative overflow-hidden shadow-[inset_0_0_50px_rgba(168,85,247,0.03)] aspect-[860/400] md:aspect-auto">
              <object
                data={workflowSvg}
                type="image/svg+xml"
                className="w-full max-w-[750px]"
              >
                <img
                  src={workflowSvg}
                  alt="Protocol Workflow Animation"
                  className="w-full max-w-[750px]"
                />
              </object>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
