import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import videoBgAbout from '../../assets/video-bg-about.webm';
import diepsLogo from '../../assets/Dieps-white.svg';

export const About = () => {
  const quoteRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  const runAnimation = () => {
    if (animatedRef.current) return;
    animatedRef.current = true;
    gsap.fromTo(logoRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }
    );
    gsap.fromTo(quoteRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, delay: 0.1, ease: 'power3.out' }
    );
    gsap.fromTo(descRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out' }
    );
  };

  useEffect(() => {
    // Use the snap scroll container as the IntersectionObserver root
    const scrollContainer = document.querySelector('.custom-scrollbar') as HTMLElement | null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runAnimation();
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: scrollContainer,
      threshold: 0.25,
    });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="w-full min-h-[100svh] px-6 md:px-24 bg-[#030008] relative z-10 flex flex-col items-center justify-center py-20 overflow-hidden">
      {/* Background Video - moved lower with 80% opacity */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none overflow-hidden flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-80 mix-blend-screen translate-y-24 scale-105"
        >
          <source src={videoBgAbout} type="video/webm" />
        </video>
      </div>

      {/* Background ambient glow */}
      <div className="absolute top-[30%] left-[25%] w-[400px] h-[400px] rounded-full bg-purple-900/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[25%] w-[500px] h-[500px] rounded-full bg-[#1b083c]/15 blur-[150px] pointer-events-none z-0" />

      {/* Main Content Container - Centered */}
      <div className="max-w-[1000px] w-full flex flex-col items-center text-center z-10 relative gap-8 md:gap-10">
        
        {/* 1. DIEPS Logo (Top Center) */}
        <div ref={logoRef} className="flex flex-col items-center opacity-0">
          <img src={diepsLogo} alt="DIEPS Logo" className="h-7 sm:h-9 md:h-10 w-auto object-contain mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#a855f7] font-bold">INTELLIGENCE</span>
        </div>

        {/* 2. Main Slogan (Focal Point, Centered, Prominent) */}
        <div className="w-full max-w-[900px] px-2 md:my-3">
          <h2
            ref={quoteRef}
            className="font-display font-bold text-[32px] sm:text-[40px] md:text-[50px] lg:text-[56px] leading-[1.2] text-white opacity-0"
          >
            <span className="block mb-2">
              <span className="highlight-letter">D</span>efining{' '}
              <span className="highlight-letter">I</span>ntents,
            </span>
            <span className="text-white block">
              <span className="highlight-letter">E</span>xecuting{' '}
              <span className="highlight-letter">P</span>erfect{' '}
              <span className="highlight-letter">S</span>waps on{' '}
              <span className="highlight-letter">S</span>UI
            </span>
          </h2>
        </div>

        {/* 3. USP Content (Supporting copy, White, high contrast) */}
        <div
          ref={descRef}
          className="flex flex-col gap-5 text-white text-[14px] md:text-[16px] leading-relaxed font-body max-w-[660px] px-4 opacity-0"
        >
          <p className="font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            At DIEPS, we use real-time liquidity intelligence and on-chain intent execution to make DeFi on Sui simple, safe, and accessible for everyone from first-time users to seasoned traders.
          </p>
          <p className="text-white/85 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            By applying Bellman-Ford route optimization with ML-adaptive weighting and a guardian security layer, we turn a plain-English goal into a protected, optimized transaction in under 200ms.
          </p>
        </div>

      </div>
    </section>
  );
};
