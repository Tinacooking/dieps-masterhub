import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Activity, Shield, Cpu, Zap, Database, Globe } from 'lucide-react';

const ServiceCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string, key?: any }) => (
  <div
    className="service-card opacity-0 group p-10 rounded-[24px] bg-[#0a0416]/80 border border-white/[0.05] hover:border-[#a855f7]/40 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.4)]"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <Icon className="w-8 h-8 text-[#a855f7] mb-12" />
    <h3 className="text-[24px] font-display text-white mb-4 relative z-10">{title}</h3>
    <p className="text-[15px] text-[#8F8F8F] leading-relaxed relative z-10">{desc}</p>
  </div>
);

export const Services = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('.custom-scrollbar') as HTMLElement | null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          gsap.fromTo(titleRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
          );

          const cards = containerRef.current?.querySelectorAll('.service-card');
          if (cards && cards.length > 0) {
            gsap.fromTo(cards,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.25 }
            );
          }
          observer.unobserve(entry.target);
        }
      });
    }, { root: scrollContainer, threshold: 0.2 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => { observer.disconnect(); };
  }, []);

  const services = [
    { icon: Cpu, title: "Natural Language Intent Parsing", desc: "Accepts plain-English input and extracts structured trade intent using a fine-tuned LLM with domain-specific slot extraction. No forms, dropdowns, or configuration required." },
    { icon: Activity, title: "ML-Optimised Route Discovery", desc: "Uses Bellman-Ford graph search across liquidity pools combined with adaptive ML weighting to discover the most efficient swap routes. Returns estimated cost, slippage, and confidence scores." },
    { icon: Shield, title: "Guardian Risk Classification", desc: "Every transaction passes through a Guardian risk engine before execution. Detects slippage risk, stale liquidity, concentration risk, and sandwich attack patterns. High-risk trades are automatically blocked." },
    { icon: Zap, title: "Atomic PTB Execution", desc: "Compiles multi-hop swap routes into a single programmable transaction block. All operations either succeed together or revert entirely. One signature regardless of route complexity." },
    { icon: Database, title: "On-Chain Slippage Guard", desc: "Smart contract assertions enforce minimum output thresholds and liquidity freshness requirements. If execution falls below user-defined limits, the entire transaction reverts." },
    { icon: Globe, title: "Real-Time Pool Intelligence", desc: "Streams live pool events from blockchain nodes with sub-second latency. Market context is cached and continuously fed into machine learning models for ongoing optimization." },
  ];

  return (
    <section ref={containerRef} className="w-full h-full px-8 md:px-24 bg-[#030008] flex flex-col justify-center">
      <div className="max-w-[1440px] mx-auto w-full">
        <h2
          ref={titleRef}
          className="text-[32px] md:text-[48px] font-serif italic font-light text-white mb-12 text-center tracking-tight opacity-0"
        >
          Protocol Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
};
