import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export const Projects = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [monitored, setMonitored] = useState(0);
  const [pools, setPools] = useState(0);
  const [refresh, setRefresh] = useState(1000);
  const [safety, setSafety] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 1. Title Fade-in
          gsap.fromTo(titleRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
          );

          // 2. Cards Fade-in
          const cards = containerRef.current?.querySelectorAll('.subsystem-card');
          if (cards && cards.length > 0) {
            gsap.fromTo(cards,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out', delay: 0.2 }
            );
          }

          // 3. Stats Count-up Animations
          const statsObj = { monitored: 0, pools: 0, refresh: 1000, safety: 0 };
          
          gsap.to(statsObj, {
            monitored: 10,
            pools: 10000,
            refresh: 200,
            safety: 99.9,
            duration: 2.5,
            ease: 'power2.out',
            delay: 0.4,
            onUpdate: () => {
              setMonitored(Math.floor(statsObj.monitored));
              setPools(Math.floor(statsObj.pools));
              setRefresh(Math.floor(statsObj.refresh));
              setSafety(Number(statsObj.safety.toFixed(1)));
            }
          });

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <section ref={containerRef} className="w-full h-full px-8 md:px-24 bg-[#030008] flex justify-center py-10 overflow-hidden">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col justify-center h-full max-h-[900px]">
        <h2 
          ref={titleRef}
          className="text-[28px] md:text-[40px] font-serif italic font-light text-white mb-6 lg:mb-8 tracking-tight shrink-0 opacity-0"
        >
          Core Subsystems
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 min-h-0 mb-8 lg:mb-12 shrink">
          <div 
            className="subsystem-card opacity-0 group relative h-[22vh] min-h-[140px] max-h-[220px] lg:max-h-none lg:h-auto lg:aspect-[2/1] rounded-[24px] lg:rounded-[32px] overflow-hidden bg-[#0a0416] border border-white/5 shadow-[0_10px_35px_rgba(0,0,0,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#030008] via-[#030008]/40 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-[#0a0416] opacity-50 group-hover:opacity-30 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="w-[300px] h-[300px] rounded-full blur-[80px] bg-[#1e0b36] group-hover:bg-[#a855f7]/30 transition-colors duration-700" />
            </div>
            <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 z-20 pointer-events-none">
              <span className="text-[10px] lg:text-[12px] uppercase tracking-widest text-[#a855f7] font-mono mb-2 lg:mb-4 block">Intent Extraction</span>
              <h3 className="text-[24px] lg:text-[32px] font-display text-white">Solver Engine</h3>
            </div>
          </div>

          <div 
            className="subsystem-card opacity-0 group relative h-[22vh] min-h-[140px] max-h-[220px] lg:max-h-none lg:h-auto lg:aspect-[2/1] rounded-[24px] lg:rounded-[32px] overflow-hidden bg-[#0a0416] border border-white/5 shadow-[0_10px_35px_rgba(0,0,0,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#030008] via-[#030008]/40 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-[#0a0416] opacity-50 group-hover:opacity-30 transition-opacity flex items-center justify-center pointer-events-none">
               {/* Abstract linear lines */}
               <div className="w-[100px] lg:w-[200px] h-[200px] lg:h-[400px] rotate-45 border-l border-white/10 group-hover:border-[#a855f7]/30 transition-colors duration-700" />
               <div className="w-[100px] lg:w-[200px] h-[200px] lg:h-[400px] rotate-45 border-l border-white/10 group-hover:border-[#a855f7]/30 transition-colors duration-700 ml-5 lg:ml-10" />
            </div>
            <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 z-20 pointer-events-none">
              <span className="text-[10px] lg:text-[12px] uppercase tracking-widest text-white/50 font-mono mb-2 lg:mb-4 block">In-Memory Persistence</span>
              <h3 className="text-[24px] lg:text-[32px] font-display text-white">Graph State Manager</h3>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 w-full pt-6 lg:pt-12 border-t border-white/5 shrink-0 mt-auto">
          <div className="flex flex-col gap-1 lg:gap-2">
            <h4 className="text-[32px] sm:text-[40px] md:text-[36px] lg:text-[44px] xl:text-[56px] font-serif font-light text-white tracking-tighter whitespace-nowrap">
              {monitored}+
            </h4>
            <span className="text-[10px] lg:text-[14px] font-mono text-[#8F8F8F] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">DEXs Monitored</span>
          </div>

          <div className="flex flex-col gap-1 lg:gap-2">
            <h4 className="text-[32px] sm:text-[40px] md:text-[36px] lg:text-[44px] xl:text-[56px] font-serif font-light text-white tracking-tighter whitespace-nowrap">
              {pools.toLocaleString()}+
            </h4>
            <span className="text-[10px] lg:text-[14px] font-mono text-[#8F8F8F] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">Active Pools</span>
          </div>

          <div className="flex flex-col gap-1 lg:gap-2">
            <h4 className="text-[32px] sm:text-[40px] md:text-[36px] lg:text-[44px] xl:text-[56px] font-serif font-light text-white tracking-tighter whitespace-nowrap">
              &lt; {refresh}ms
            </h4>
            <span className="text-[10px] lg:text-[14px] font-mono text-[#8F8F8F] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">Graph Refresh</span>
          </div>

          <div className="flex flex-col gap-1 lg:gap-2">
            <h4 className="text-[32px] sm:text-[40px] md:text-[36px] lg:text-[44px] xl:text-[56px] font-serif font-light text-white tracking-tighter whitespace-nowrap">
              {safety}%
            </h4>
            <span className="text-[10px] lg:text-[14px] font-mono text-[#8F8F8F] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">Execution Safety</span>
          </div>
        </div>
      </div>
    </section>
  );
};
