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

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
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

  const services = [
    { icon: Globe, title: "Liquidity Graph", desc: "Real-time in-memory tracking across major DEXs including Cetus, DeepBook, and Turbos." },
    { icon: Activity, title: "Routing Engine", desc: "Advanced pathfinding algorithms computing optimal multi-hop swap execution routes instantly." },
    { icon: Cpu, title: "Intent Extraction", desc: "Seamless conversion of complex NLP user intents into optimized execution pathways." },
    { icon: Shield, title: "Bayesian Guardian", desc: "Algorithmic risk evaluation preventing routing through manipulated or low-depth liquidity pools." },
    { icon: Zap, title: "Event Processor", desc: "Live synchronization with on-chain swap events and state updates via gRPC streams." },
    { icon: Database, title: "Omni-Normalization", desc: "Unified data models normalizing varying pool structures across fragmented decentralized exchanges." },
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
