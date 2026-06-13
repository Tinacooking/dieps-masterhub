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
      <div className="absolute w-[450px] h-[450px] rounded-full blur-[150px] bg-[#a855f7]/10 -bottom-20 -left-20 pointer-events-none" />
      <div className="absolute w-[450px] h-[450px] rounded-full blur-[150px] bg-purple-600/10 -top-20 -right-20 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto w-full flex-1 flex flex-col justify-center items-center min-h-0">
        
        {/* Title: Apple Keynote Style */}
        <h2
          ref={titleRef}
          className="text-[32px] md:text-[48px] font-sans font-bold text-white mb-6 text-center tracking-tight opacity-0 shrink-0 uppercase"
        >
          DIEPS WORKFLOW
        </h2>

        {/* Preserved Technical Mathematical content - hidden from composition but retained in project code */}
        <div ref={conceptRef} className="hidden" aria-hidden="true">
          <div className="space-y-3">
            <span className="font-mono text-[10px] text-[#a855f7] tracking-widest uppercase font-bold">Optimal Path Formulation</span>
            <h3 className="text-[22px] md:text-[28px] text-white font-display">Routing Subgraph Concept</h3>
            <p className="text-[13px] md:text-[14px] text-white/50 leading-relaxed font-body">
              DIEPS normalizes fragmented liquidity pools across the Sui ecosystem into a directed graph. Each pool is represented as a directed edge with a penalty weight calculated dynamically using the formula below:
            </p>
          </div>

          {/* Formula Panel */}
          <div className="text-[12px] xs:text-[14px] sm:text-[17px] md:text-[19px] lg:text-[13px] xl:text-[16px] 2xl:text-[20px] text-purple-100 bg-[#12082b]/95 border-2 border-[#a855f7]/40 rounded-2xl p-5 md:p-6 tracking-wide shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(168,85,247,0.25),inset_0_0_20px_rgba(168,85,247,0.15)] flex flex-col items-center justify-center relative overflow-hidden group select-none transition-all duration-300 hover:border-[#a855f7]/70">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#0ea5e9] via-[#a855f7] to-[#0ea5e9]"></div>
            <div className="flex items-center gap-1.5 self-start mb-3 font-mono text-[8.5px] text-[#a855f7] uppercase tracking-[0.2em] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-pulse"></span>
              PATH FINDING PENALTY WEIGHT EQUATION
            </div>
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
          </div>
        </div>

        {/* Centered Visual: Scaled Up Interactive D3 Graph in Iframe */}
        <div
          ref={graphRef}
          className="w-full max-w-[1100px] h-[520px] md:h-[620px] opacity-0 relative z-10 flex flex-col justify-center"
        >
          <div className="w-full h-full rounded-[24px] lg:rounded-[32px] bg-[#12082b]/30 border-2 border-[#a855f7]/30 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(168,85,247,0.2),inset_0_0_30px_rgba(168,85,247,0.1)]">
            <iframe 
              src="/graph.html" 
              className="w-full h-full border-none rounded-[22px] lg:rounded-[30px]" 
              title="DIEPS Liquidity Network Workflow"
            />
          </div>
        </div>

      </div>
    </section>
  );
};
