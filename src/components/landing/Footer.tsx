import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('.custom-scrollbar') as HTMLElement | null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          const children = footerRef.current?.children;
          if (children && children.length > 0) {
            gsap.fromTo(Array.from(children),
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
            );
          }
          observer.unobserve(entry.target);
        }
      });
    }, { root: scrollContainer, threshold: 0.3 });

    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="w-full py-12 px-8 md:px-24 bg-[#030008] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10"
    >
      <div className="opacity-0 text-[12px] uppercase tracking-[0.3em] text-white/40 font-mono">DIEPS Protocol © 2026</div>
      <div className="opacity-0 flex gap-8">
        <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">Twitter</a>
        <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">Research</a>
        <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">GitHub</a>
      </div>
    </footer>
  );
};
