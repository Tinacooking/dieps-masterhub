import React from 'react';
import { motion } from 'framer-motion';

export const Testimonials = () => {
  return (
    <section className="w-full h-full px-8 md:px-24 bg-[#030008] relative z-10 overflow-hidden flex items-center justify-center">
      <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#1e0b36]/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute left-10 bottom-0 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1000px] mx-auto text-center relative z-20">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
        >
          <p className="text-[24px] md:text-[36px] font-serif italic font-light text-white leading-relaxed mb-12">
            "The liquidity intelligence layer provided by DIEPS radically transformed how we execute swaps. Their continuous real-time graph aggregation is unmatched in the entire Sui ecosystem."
          </p>
          <div className="flex flex-col items-center justify-center gap-2">
            <h5 className="text-[16px] text-white font-medium tracking-wide">Ecosystem Validator</h5>
            <span className="text-[12px] font-mono text-white/40 uppercase tracking-widest">Decentralized Finance Automation</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
