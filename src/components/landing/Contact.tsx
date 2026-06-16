import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import videoBgContact from '../../assets/video-bg-contact.webm';

export const Contact = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('.custom-scrollbar') as HTMLElement | null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          gsap.fromTo(contentRef.current,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
          );
          gsap.fromTo(formRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1.2, delay: 0.2, ease: 'power3.out' }
          );
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
    <section ref={sectionRef} className="w-full h-full px-8 md:px-24 bg-[#030008] flex flex-col justify-center relative overflow-hidden">

      {/* Video background */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen"
        >
          <source src={videoBgContact} type="video/webm" />
        </video>
      </div>

      {/* Ambient glow */}
      <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-purple-900/15 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-[#1b083c]/20 blur-[100px] pointer-events-none z-0" />

      <div className="adaptive-scale w-full h-full flex items-center justify-center relative z-10">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full relative z-10">

        <div ref={contentRef} className="opacity-0">
          <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-[#a855f7] font-semibold mb-4 block">Contact</span>
          <h2 className="text-[40px] md:text-[56px] font-serif italic font-light text-white mb-6 tracking-tight">System Integration</h2>
          <p className="text-[18px] text-[#8F8F8F] font-body mb-12 max-w-[400px]">
            Ready to plug into the Liquidity Intelligence Layer? Request API access to our endpoints.
          </p>
        </div>

        <form ref={formRef} className="flex flex-col gap-8 relative z-10 opacity-0">
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
          <button type="button" className="button self-start mt-8">
            <span className="fold"></span>
            <div className="points_wrapper">
              <div className="point"></div>
              <div className="point"></div>
              <div className="point"></div>
              <div className="point"></div>
              <div className="point"></div>
              <div className="point"></div>
              <div className="point"></div>
              <div className="point"></div>
              <div className="point"></div>
              <div className="point"></div>
            </div>
            <span className="inner">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="15.5" r="5.5" />
                <path d="m21 2-9.6 9.6" />
                <path d="m15.5 7.5 3 3" />
                <path d="m18.5 4.5 3 3" />
              </svg>
              Request API Key
            </span>
          </button>
        </form>
      </div>
      </div>
    </section>
  );
};

