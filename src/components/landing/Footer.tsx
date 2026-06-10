import React from 'react';

export const Footer = () => (
  <footer className="w-full py-12 px-8 md:px-24 bg-[#030008] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
    <div className="text-[12px] uppercase tracking-[0.3em] text-white/40 font-mono">DIEPS Protocol © 2026</div>
    <div className="flex gap-8">
      <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">Twitter</a>
      <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">Research</a>
      <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">GitHub</a>
    </div>
  </footer>
);
