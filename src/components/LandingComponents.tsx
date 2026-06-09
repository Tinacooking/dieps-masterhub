import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronRight, Activity, Shield, Cpu, Zap, Database, Globe, Play } from 'lucide-react';

export const Hero = ({ onLaunch }: { onLaunch: () => void }) => {
  return (
    <section className="relative w-full h-[100svh] bg-black overflow-hidden flex flex-col md:flex-row">
      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
        <h2 className="text-[12px] md:text-[14px] uppercase tracking-[0.3em] text-white/50 font-mono">DIEPS Protocol</h2>
      </div>
      <div className="absolute top-8 right-8 md:top-12 md:right-12 z-20">
        <span className="text-[12px] md:text-[14px] text-white/30 font-mono tracking-widest">2026</span>
      </div>

      {/* 55% Content */}
      <div className="w-full md:w-[55%] h-full flex flex-col justify-center px-8 md:px-24 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[700px]"
        >
          <h1 className="text-[50px] md:text-[70px] lg:text-[80px] leading-[1] font-display font-light text-white mb-8 tracking-tighter">
            Liquidity Intelligence Layer <br/> 
            <span className="text-white/40">For The Sui Ecosystem</span>
          </h1>
          <p className="text-[16px] md:text-[20px] text-white/50 font-body mb-12 max-w-[550px] leading-relaxed">
            Continuously collecting, normalizing, and distributing real-time liquidity data from all major decentralized exchanges to power next-generation execution.
          </p>
          
          <div className="flex items-center gap-6">
            <button onClick={onLaunch} className="group relative px-8 py-4 bg-white text-black rounded-full font-medium tracking-wide flex items-center gap-3 overflow-hidden hover:scale-[1.03] transition-transform duration-300">
              <span className="relative z-10">Launch Interface</span>
              <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center relative z-10 group-hover:bg-black/20 transition-colors">
                <ArrowRight size={16} />
              </div>
            </button>
            <button className="px-8 py-4 text-white/70 font-medium tracking-wide hover:text-white transition-colors duration-300 flex items-center gap-2">
              Read Documentation
            </button>
          </div>
        </motion.div>
      </div>

      {/* 45% Visual Graphic */}
      <div className="hidden md:flex w-[45%] h-full relative items-center justify-center pointer-events-none">
        {/* Glow behind */}
        <div className="absolute right-[10%] w-[600px] h-[600px] bg-[#9D6BFF]/20 blur-[120px] rounded-fullmix-blend-screen mix-blend-screen" />
        
        <motion.div 
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-[500px] h-[500px] flex items-center justify-center"
        >
          {/* Main glowing circle */}
          <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#9D6BFF] to-[#2B184D] shadow-[0_0_100px_rgba(157,107,255,0.4)] opacity-80 backdrop-blur-3xl" />
          
          {/* Semi circles */}
          <div className="absolute w-[450px] h-[225px] border-b-[2px] border-[#9D6BFF]/30 rounded-b-full bottom-[10%] rotate-12" />
          <div className="absolute w-[500px] h-[250px] border-b-[1px] border-white/10 rounded-b-full bottom-0 -rotate-6" />

          {/* Dots/nodes */}
          <div className="absolute top-[20%] right-[30%] w-3 h-3 bg-white rounded-full shadow-[0_0_20px_white]" />
          <div className="absolute bottom-[30%] left-[20%] w-2 h-2 bg-[#9D6BFF] rounded-full shadow-[0_0_15px_#9D6BFF]" />
        </motion.div>
      </div>
    </section>
  );
};

export const About = () => {
  return (
    <section className="w-full h-full px-8 md:px-24 bg-[#050505] relative z-10 flex items-center justify-center">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-[40px] md:text-[56px] font-display font-light leading-[1.1] text-white">
            The Neural Engine for Decentralized Intent Execution
          </h2>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.2 }}
          className="flex flex-col justify-end"
        >
          <p className="text-[18px] md:text-[22px] text-[#8F8F8F] font-body leading-relaxed mb-8">
            At DIEPS, we don't just route trades. We build a living, real-time liquidity graph—dynamically capturing pool states, validation metrics, and algorithmic risk scores across the entire Sui ecosystem.
          </p>
          <p className="text-[16px] text-white/40 font-body leading-relaxed">
            By merging high-performance asynchronous data aggregation with Bayesian Guardian risk models, our engine guarantees optimal execution paths with absolute zero latency.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const ServiceCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number, key?: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="group p-10 rounded-[24px] bg-[#0D0D0D] border border-white/[0.08] hover:border-[#9D6BFF]/30 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#9D6BFF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <Icon className="w-8 h-8 text-[#9D6BFF] mb-12" />
    <h3 className="text-[24px] font-display text-white mb-4 relative z-10">{title}</h3>
    <p className="text-[15px] text-[#8F8F8F] leading-relaxed relative z-10">{desc}</p>
  </motion.div>
)

export const Services = () => {
  const services = [
    { icon: Globe, title: "Liquidity Graph", desc: "Real-time in-memory tracking of across major DEXs including Cetus, DeepBook, and Turbos." },
    { icon: Activity, title: "Routing Engine", desc: "Advanced pathfinding algorithms computing optimal multi-hop swap execution routes instantly." },
    { icon: Cpu, title: "Intent Extraction", desc: "Seamless conversion of complex NLP user intents into optimized execution pathways." },
    { icon: Shield, title: "Bayesian Guardian", desc: "Algorithmic risk evaluation preventing routing through manipulated or low-depth liquidity pools." },
    { icon: Zap, title: "Event Processor", desc: "Live synchronization with on-chain swap events and state updates via gRPC streams." },
    { icon: Database, title: "Omni-Normalization", desc: "Unified data models normalizing varying pool structures across fragmented decentralized exchanges." },
  ];

  return (
    <section className="w-full h-full px-8 md:px-24 bg-black flex flex-col justify-center">
      <div className="max-w-[1440px] mx-auto w-full">
        <h2 className="text-[32px] md:text-[48px] font-display font-light text-white mb-12 text-center tracking-tight">Protocol Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <ServiceCard key={s.title} {...s} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export const Projects = () => {
  return (
    <section className="w-full h-full px-8 md:px-24 bg-[#050505] flex justify-center py-10 overflow-hidden">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col justify-center h-full max-h-[900px]">
        <h2 className="text-[28px] md:text-[40px] font-display font-light text-white mb-6 lg:mb-8 tracking-tight shrink-0">Core Subsystems</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 min-h-0 mb-8 lg:mb-12 shrink">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group relative h-[22vh] min-h-[140px] max-h-[220px] lg:max-h-none lg:h-auto lg:aspect-[2/1] rounded-[24px] lg:rounded-[32px] overflow-hidden bg-[#0a0a0a] border border-white/5"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-[#111] opacity-50 group-hover:opacity-30 transition-opacity flex items-center justify-center">
              <div className="w-[300px] h-[300px] rounded-full blur-[80px] bg-[#2B184D] group-hover:bg-[#9D6BFF]/40 transition-colors duration-700" />
            </div>
            <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 z-20">
              <span className="text-[10px] lg:text-[12px] uppercase tracking-widest text-[#9D6BFF] font-mono mb-2 lg:mb-4 block">Intent Extraction</span>
              <h3 className="text-[24px] lg:text-[32px] font-display text-white">Solver Engine</h3>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group relative h-[22vh] min-h-[140px] max-h-[220px] lg:max-h-none lg:h-auto lg:aspect-[2/1] rounded-[24px] lg:rounded-[32px] overflow-hidden bg-[#0a0a0a] border border-white/5"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-[#111] opacity-50 group-hover:opacity-30 transition-opacity flex items-center justify-center">
               {/* Abstract linear lines */}
               <div className="w-[100px] lg:w-[200px] h-[200px] lg:h-[400px] rotate-45 border-l border-white/10 group-hover:border-[#9D6BFF]/40 transition-colors duration-700" />
               <div className="w-[100px] lg:w-[200px] h-[200px] lg:h-[400px] rotate-45 border-l border-white/10 group-hover:border-[#9D6BFF]/40 transition-colors duration-700 ml-5 lg:ml-10" />
            </div>
            <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 z-20">
              <span className="text-[10px] lg:text-[12px] uppercase tracking-widest text-white/50 font-mono mb-2 lg:mb-4 block">In-Memory Persistence</span>
              <h3 className="text-[24px] lg:text-[32px] font-display text-white">Graph State Manager</h3>
            </div>
          </motion.div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 w-full pt-6 lg:pt-12 border-t border-white/5 shrink-0 mt-auto">
          {[
            { label: "DEXs Monitored", val: "10+" },
            { label: "Active Pools", val: "10,000+" },
            { label: "Graph Refresh", val: "< 200ms" },
            { label: "Execution Safety", val: "99.9%" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col gap-1 lg:gap-2"
            >
              <h4 className="text-[32px] sm:text-[40px] md:text-[36px] lg:text-[44px] xl:text-[56px] font-display font-light text-white tracking-tighter whitespace-nowrap">{stat.val}</h4>
              <span className="text-[10px] lg:text-[14px] font-mono text-[#8F8F8F] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};


export const Testimonials = () => {
  return (
    <section className="w-full h-full px-8 md:px-24 bg-[#050505] relative z-10 overflow-hidden flex items-center justify-center">
      <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#2B184D]/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="max-w-[1000px] mx-auto text-center relative z-20">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
        >
          <p className="text-[24px] md:text-[36px] font-display font-light text-white leading-relaxed mb-12">
            "The liquidity intelligence layer provided by DIEPS radically transformed how we execute swaps. Their continuous real-time graph aggregation is unmatched in the entire Sui ecosystem."
          </p>
          <div className="flex flex-col items-center justify-center gap-2">
            <h5 className="text-[16px] text-white font-medium tracking-wide">Ecosystem Validator</h5>
            <span className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Decentralized Finance Automation</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const Contact = () => {
  return (
    <section className="w-full h-full px-8 md:px-24 bg-black flex flex-col justify-center">
       <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          <div>
            <h2 className="text-[40px] md:text-[56px] font-display font-light text-white mb-6 tracking-tight">System Integration</h2>
            <p className="text-[18px] text-[#8F8F8F] font-body mb-12 max-w-[400px]">
              Ready to plug into the Liquidity Intelligence Layer? Request API access to our endpoints.
            </p>
          </div>
          
          <form className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Name</label>
              <input type="text" className="w-full bg-transparent border-b border-white/20 pb-4 text-white font-body focus:outline-none focus:border-[#9D6BFF] transition-colors" placeholder="John Doe" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Email</label>
              <input type="email" className="w-full bg-transparent border-b border-white/20 pb-4 text-white font-body focus:outline-none focus:border-[#9D6BFF] transition-colors" placeholder="Ex: john@enterprise.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Message</label>
              <textarea rows={4} className="w-full bg-transparent border-b border-white/20 pb-4 text-white font-body focus:outline-none focus:border-[#9D6BFF] transition-colors" placeholder="Describe your integration requirements..." />
            </div>
            <button type="button" className="self-start mt-8 px-10 py-4 bg-[#9D6BFF] text-white rounded-full font-medium tracking-wide hover:bg-[#854dff] transition-colors">
              Request API Key
            </button>
          </form>
       </div>
    </section>
  );
};

export const Footer = () => (
  <footer className="w-full py-12 px-8 md:px-24 bg-black border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
    <div className="text-[12px] uppercase tracking-[0.3em] text-white/50 font-mono">DIEPS Protocol © 2026</div>
    <div className="flex gap-8">
      <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Twitter</a>
      <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Research</a>
      <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">GitHub</a>
    </div>
  </footer>
);
