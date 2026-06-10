import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const Hero = ({ onLaunch }: { onLaunch: () => void }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const launchBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 1. Content Stagger Entrance Timeline
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1 } });
    
    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, delay: 0.2 }
    )
    .fromTo(descRef.current, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0 },
      '-=0.75'
    )
    .fromTo(buttonsRef.current, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0 },
      '-=0.75'
    )
    .fromTo(portalRef.current, 
      { opacity: 0, scale: 0.94, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 1.4, ease: 'power3.out' },
      '-=1'
    );

    // 2. Portal Bobbing Float Animation
    const portalFloat = gsap.to(portalRef.current, {
      y: -12,
      duration: 5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    // 3. Launch button Bobbing Float Animation
    const btnFloat = gsap.to(launchBtnRef.current, {
      y: -8,
      duration: 3.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    return () => {
      tl.kill();
      portalFloat.kill();
      btnFloat.kill();
    };
  }, []);

  return (
    <section className="relative w-full h-[100svh] bg-[#030008] overflow-hidden flex flex-col md:flex-row z-10">
      {/* Starry Night sky background */}
      <div className="absolute inset-0 stars-bg z-0 pointer-events-none" />

      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
        <h2 className="text-[12px] md:text-[14px] uppercase tracking-[0.3em] text-white/50 font-mono">DIEPS Protocol</h2>
      </div>
      <div className="absolute top-8 right-8 md:top-12 md:right-12 z-20">
        <span className="text-[12px] md:text-[14px] text-white/30 font-mono tracking-widest">2026</span>
      </div>

      {/* 55% Content */}
      <div className="w-full md:w-[55%] h-full flex flex-col justify-center px-8 md:px-24 z-10 relative">
        <div className="max-w-[700px]">
          <h1 ref={titleRef} className="text-[44px] md:text-[56px] lg:text-[68px] leading-[1.1] font-serif font-light text-white mb-6 tracking-tight opacity-0">
            <span className="italic">DIEPS Protocol</span> <br />
            <span className="text-white/40 font-sans font-light text-[24px] md:text-[32px] tracking-wide block mt-2">
              An Intent-Based Liquidity Engine for the Sui Ecosystem
            </span>
          </h1>
          
          <p ref={descRef} className="text-[14px] md:text-[16px] text-white/45 font-body mb-8 max-w-[500px] leading-relaxed opacity-0">
            With a single plain-English input, DIEPS delivers the ultimate execution: “Optimized, Protected, and Executed.” Smart Routing - Risk Protection - One-Click Execution. No configuration. No jargon. No blind signing.
          </p>
          
          <div ref={buttonsRef} className="flex items-center gap-6 opacity-0">
            <button 
              onClick={onLaunch} 
              className="group relative px-8 py-3.5 bg-white text-black rounded-full font-medium tracking-wide flex items-center gap-3 overflow-hidden hover:scale-[1.03] transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              <span className="relative z-10 text-[13px] font-sans">Launch Interface</span>
              <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center relative z-10 group-hover:bg-black/20 transition-colors">
                <span className="material-symbols-outlined text-[14px] text-black">arrow_forward</span>
              </span>
            </button>
            <button className="px-8 py-3.5 text-white/60 font-medium tracking-wide hover:text-white transition-colors duration-300 flex items-center gap-2 cursor-pointer text-[13px]">
              Read Documentation
            </button>
          </div>
        </div>
      </div>

      {/* 45% Visual Graphic: Portal Archway */}
      <div className="hidden md:flex w-[45%] h-full relative items-center justify-center z-10 pointer-events-auto">
        {/* Glow behind the arch */}
        <div className="absolute w-[450px] h-[450px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
        
        <div 
          ref={portalRef}
          className="relative w-[280px] h-[420px] lg:w-[320px] lg:h-[480px] rounded-t-full border-[1px] border-purple-500/30 bg-[#070212] overflow-hidden flex flex-col items-center justify-end pb-16 shadow-[0_0_80px_rgba(168,85,247,0.2)] opacity-0"
        >
          {/* Intense neon violet gradient inside portal */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/90 via-purple-600/35 to-purple-900/10 opacity-95 pointer-events-none" />
          
          {/* Inner shadow/glow to define depth */}
          <div className="absolute inset-0 rounded-t-full shadow-[inset_0_0_60px_rgba(168,85,247,0.7)] pointer-events-none" />

          {/* Floating sphere button inside portal */}
          <button 
            ref={launchBtnRef}
            onClick={onLaunch}
            className="w-20 h-20 rounded-full bg-black border border-white/20 text-white flex items-center justify-center text-[14px] font-serif italic tracking-wide cursor-pointer relative z-20 shadow-[0_4px_25px_rgba(0,0,0,0.8)] hover:border-white transition-all hover:scale-[1.08] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]"
          >
            Launch
          </button>
        </div>
      </div>
    </section>
  );
};
