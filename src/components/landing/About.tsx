import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import videoBgAbout from '../../assets/video-bg-about.webm';

export const About = () => {
  const quoteRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  const runAnimation = () => {
    if (animatedRef.current) return;
    animatedRef.current = true;
    gsap.fromTo(quoteRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
    );
    gsap.fromTo(descRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.2, delay: 0.2, ease: 'power3.out' }
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
    <section ref={sectionRef} className="w-full min-h-[90vh] lg:min-h-screen px-6 md:px-24 bg-[#030008] relative z-10 flex flex-col justify-between py-24 overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen"
        >
          <source src={videoBgAbout} type="video/webm" />
        </video>
      </div>

      {/* Background ambient glow */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-900/5 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#1b083c]/10 blur-[120px] pointer-events-none z-0" />

      {/* Top Left category tracker */}
      <div className="max-w-[1400px] mx-auto w-full text-left shrink-0 z-10 relative mb-12">
        <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-[#a855f7] font-semibold">Intelligence</span>
      </div>

      {/* Main Grid Container */}
      <div className="max-w-[1400px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-stretch z-10 relative">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          <h2
            ref={quoteRef}
            className="font-display font-bold text-[30px] md:text-[40px] lg:text-[48px] leading-[1.15] text-white text-left opacity-0 max-w-[800px]"
          >
            <span className="block mb-2">
              <span className="highlight-letter">D</span>
              <span className="highlight-letter">I</span>
              <span className="highlight-letter">E</span>
              <span className="highlight-letter">P</span>
              <span className="highlight-letter">S</span>
              {' '}—{' '}
              <span className="highlight-letter">D</span>efining{' '}
              <span className="highlight-letter">I</span>ntents,
            </span>
            <span className="text-white/40 block">
              <span className="highlight-letter">E</span>xecuting{' '}
              <span className="highlight-letter">P</span>erfect{' '}
              <span className="highlight-letter">s</span>waps on{' '}
              <span className="highlight-letter">S</span>UI
            </span>
          </h2>
        </div>

        {/* Right Column */}
        <div
          ref={descRef}
          className="lg:col-span-5 self-end flex flex-col gap-6 text-white/40 text-[13px] md:text-[15px] leading-relaxed font-body text-left lg:text-right opacity-0 lg:pl-12 pb-4"
        >
          <p className="max-w-[480px] lg:ml-auto">
            At DIEPS, we use real-time liquidity intelligence and on-chain intent execution to make DeFi on Sui simple, safe, and accessible for everyone from first-time users to seasoned traders.
          </p>
          <p className="max-w-[480px] lg:ml-auto">
            By applying Bellman-Ford route optimization with ML-adaptive weighting and a guardian security layer, we turn a plain-English goal into a protected, optimized transaction in under 200ms.
          </p>
        </div>
      </div>
    </section>
  );
};
