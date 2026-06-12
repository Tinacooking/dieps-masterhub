import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import UnicornScene from 'unicornstudio-react';
import diepsLogo from '../../assets/Dieps-white.svg';
import heroObject from '../../assets/hero-object2.png';

export const Hero = ({ onLaunch }: { onLaunch: () => void }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const heroObjRef = useRef<HTMLImageElement>(null);

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
    .fromTo(heroObjRef.current,
      { opacity: 0, scale: 0.92, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power3.out' },
      '-=0.8'
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="relative w-full h-[100svh] bg-[#030008] overflow-hidden flex flex-col md:flex-row z-10">
      {/* Unicorn Studio Background Scene with crop layout to hide watermark */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none opacity-60 mix-blend-screen overflow-hidden">
        <div className="absolute top-0 left-0 right-0 bottom-[-50px] w-full h-[calc(100%+50px)]">
          <UnicornScene
            projectId="huaaX0ZoGBIImpqnKoH0"
            width="100%"
            height="100%"
            scale={1}
            dpi={1.5}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.4/dist/unicornStudio.umd.js"
          />
        </div>
      </div>

      {/* Starry Night sky background */}
      <div className="absolute inset-0 stars-bg z-0 pointer-events-none" />

      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20 flex items-center">
        <img src={diepsLogo} alt="DIEPS Logo" className="h-5 sm:h-6 md:h-7 w-auto object-contain" />
      </div>
      <div className="absolute top-8 right-8 md:top-12 md:right-12 z-20">
        <span className="text-[12px] md:text-[14px] text-white/30 font-mono tracking-widest">2026</span>
      </div>

      {/* 55% Content */}
      <div className="w-full md:w-[55%] h-full flex flex-col justify-center px-8 md:px-24 z-10 relative">
        <div className="max-w-[700px]">
          <h1 ref={titleRef} className="text-[44px] md:text-[56px] lg:text-[68px] leading-[1.1] font-serif font-light text-white mb-6 tracking-tight opacity-0">
            <span className="italic">An Intent-Based</span> <br />
            <span className="italic">Liquidity Engine</span> <br />
            <span className="text-white/40 font-sans font-light text-[24px] md:text-[32px] tracking-wide block mt-2">
              for the Sui Ecosystem
            </span>
          </h1>
          
          <p ref={descRef} className="text-[14px] md:text-[16px] text-white/45 font-body mb-8 max-w-[600px] leading-relaxed opacity-0">
            With a single plain-English input, DIEPS delivers the ultimate execution: “Optimized, Protected, and Executed.”<br />
            Smart Routing - Risk Protection - One-Click Execution.<br />
            No configuration. No jargon. No blind signing.<br />
            That's DIEPS - Defining Intents Executing Perfect Swaps
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

      {/* 45% Visual — Hero Object */}
      <div className="hidden md:flex w-[45%] h-full relative items-center justify-center z-10 pointer-events-none">
        {/* Glow behind image */}
        <div className="absolute w-[520px] h-[520px] bg-purple-600/15 blur-[130px] rounded-full" />
        <img
          ref={heroObjRef}
          src={heroObject}
          alt="DIEPS Liquidity Engine Visual"
          className="relative z-10 w-[85%] max-w-[560px] opacity-0 select-none drop-shadow-[0_0_60px_rgba(168,85,247,0.25)]"
          style={{ animation: 'hero-float 6s ease-in-out infinite' }}
          draggable={false}
        />
      </div>

      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          33%       { transform: translateY(-14px) rotate(0.5deg); }
          66%       { transform: translateY(-6px) rotate(-0.3deg); }
        }
      `}</style>
    </section>
  );
};
