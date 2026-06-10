import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import UnicornScene from 'unicornstudio-react';

export const About = () => {
  const quoteRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const sceneWrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Unicorn Studio Scene breathing pulse animation (runs infinitely)
    const scenePulse = gsap.to(sceneWrapperRef.current, {
      scale: 1.03,
      opacity: 0.9,
      duration: 6,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    // 2. Viewport entrance animation for text
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.fromTo(quoteRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
          );
          gsap.fromTo(descRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out' }
          );
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      scenePulse.kill();
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="w-full h-full px-8 md:px-24 bg-[#030008] relative z-10 flex flex-col justify-between py-20 overflow-hidden">
      {/* Top tag */}
      <div className="max-w-[1440px] mx-auto w-full text-left shrink-0">
        <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-white/30">Intelligence</span>
      </div>

      {/* Main Quote & Description */}
      <div className="max-w-[1000px] mx-auto text-center flex-1 flex flex-col justify-center z-10 my-8">
        <h2
          ref={quoteRef}
          className="font-serif italic font-light text-[32px] md:text-[52px] lg:text-[62px] text-white leading-tight mb-8 opacity-0"
        >
          Defining intents is not darkness.<br />
          It is sovereign light.
        </h2>

        <div
          ref={descRef}
          className="max-w-[720px] mx-auto opacity-0"
        >
          <p className="text-[13px] md:text-[15px] text-white/45 leading-relaxed font-body">
            At DIEPS, we use real-time liquidity intelligence and on-chain intent execution to make DeFi on Sui simple, safe, and accessible.
            By applying path optimization with ML-adaptive weighting and a mandatory Guardian safety layer, we turn plain-English goals into protected, atomic multi-hop transactions in under 200ms.
          </p>
        </div>
      </div>

      {/* Unicorn Studio Scene at the bottom replacing glowing mound */}
      <div
        ref={sceneWrapperRef}
        className="absolute bottom-[-160px] left-1/2 -translate-x-1/2 z-0 pointer-events-none opacity-80 scale-[0.6] sm:scale-[0.8] md:scale-[0.9] lg:scale-[1] origin-center"
      >
        <UnicornScene
          projectId="YES5oKT3zYfiruoILzOp"
          width="1440px"
          height="900px"
          scale={1}
          dpi={1.5}
          sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.1/dist/unicornStudio.umd.js"
        />
      </div>
    </section>
  );
};
