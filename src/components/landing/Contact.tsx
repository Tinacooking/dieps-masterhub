import React from 'react';

export const Contact = () => {
  return (
    <section className="w-full h-full px-8 md:px-24 bg-[#030008] flex flex-col justify-center">
       <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full relative">
          <div className="absolute right-[20%] top-[-50px] w-[300px] h-[300px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />
          <div>
            <h2 className="text-[40px] md:text-[56px] font-serif italic font-light text-white mb-6 tracking-tight">System Integration</h2>
            <p className="text-[18px] text-[#8F8F8F] font-body mb-12 max-w-[400px]">
              Ready to plug into the Liquidity Intelligence Layer? Request API access to our endpoints.
            </p>
          </div>
          
          <form className="flex flex-col gap-8 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Name</label>
              <input type="text" className="w-full bg-transparent border-b border-white/20 pb-4 text-white font-body focus:outline-none focus:border-[#a855f7] transition-colors" placeholder="John Doe" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Email</label>
              <input type="email" className="w-full bg-transparent border-b border-white/20 pb-4 text-white font-body focus:outline-none focus:border-[#a855f7] transition-colors" placeholder="Ex: john@enterprise.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Message</label>
              <textarea rows={4} className="w-full bg-transparent border-b border-white/20 pb-4 text-white font-body focus:outline-none focus:border-[#a855f7] transition-colors" placeholder="Describe your integration requirements..." />
            </div>
            <button type="button" className="self-start mt-8 px-10 py-4 bg-[#a855f7] text-white rounded-full font-medium tracking-wide hover:bg-[#9333ea] transition-colors cursor-pointer shadow-[0_4px_20px_rgba(168,85,247,0.25)]">
              Request API Key
            </button>
          </form>
       </div>
    </section>
  );
};
