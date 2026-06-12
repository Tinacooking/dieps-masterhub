import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// Floating pixel block positions (Tetris-like aesthetic)
const PIXEL_BLOCKS = [
  // Left side
  { top: '12%',  left: '4%',  w: 36, h: 36, delay: 0,    dur: 6.5,  opacity: 0.09 },
  { top: '28%',  left: '7%',  w: 20, h: 20, delay: 1.2,  dur: 5.8,  opacity: 0.06 },
  { top: '52%',  left: '3%',  w: 48, h: 24, delay: 0.6,  dur: 7.2,  opacity: 0.07 },
  { top: '70%',  left: '9%',  w: 24, h: 48, delay: 2.1,  dur: 6.1,  opacity: 0.05 },
  { top: '18%',  left: '14%', w: 16, h: 16, delay: 1.5,  dur: 8.0,  opacity: 0.08 },
  { top: '44%',  left: '11%', w: 32, h: 16, delay: 0.3,  dur: 5.4,  opacity: 0.06 },
  // Right side
  { top: '10%',  left: '82%', w: 40, h: 20, delay: 0.8,  dur: 6.9,  opacity: 0.08 },
  { top: '24%',  left: '88%', w: 20, h: 40, delay: 1.8,  dur: 5.6,  opacity: 0.06 },
  { top: '48%',  left: '85%', w: 28, h: 28, delay: 0.2,  dur: 7.5,  opacity: 0.09 },
  { top: '65%',  left: '90%', w: 16, h: 32, delay: 2.4,  dur: 6.3,  opacity: 0.05 },
  { top: '80%',  left: '83%', w: 36, h: 18, delay: 1.0,  dur: 8.2,  opacity: 0.07 },
  { top: '35%',  left: '79%', w: 20, h: 20, delay: 0.5,  dur: 5.2,  opacity: 0.06 },
  // Bottom area (lighter, near glow)
  { top: '82%',  left: '30%', w: 24, h: 24, delay: 1.3,  dur: 6.7,  opacity: 0.12 },
  { top: '88%',  left: '50%', w: 32, h: 16, delay: 0.7,  dur: 5.9,  opacity: 0.10 },
  { top: '85%',  left: '65%', w: 18, h: 36, delay: 2.0,  dur: 7.0,  opacity: 0.11 },
  { top: '78%',  left: '18%', w: 40, h: 20, delay: 0.4,  dur: 6.4,  opacity: 0.09 },
];

export const Testimonials = () => {
  const cardRef    = useRef<HTMLDivElement>(null);
  const badgeRef   = useRef<HTMLDivElement>(null);
  const quoteRef   = useRef<HTMLParagraphElement>(null);
  const metaRef    = useRef<HTMLDivElement>(null);
  
  const animatedRef = useRef(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('.custom-scrollbar') as HTMLElement | null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;

          gsap.fromTo(cardRef.current,
            { opacity: 0, scale: 0.97, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 1.0, ease: 'power3.out' }
          );
          gsap.fromTo(badgeRef.current,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power3.out' }
          );
          gsap.fromTo(quoteRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.0, delay: 0.45, ease: 'power3.out' }
          );
          gsap.fromTo(metaRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.65, ease: 'power3.out' }
          );

          observer.unobserve(entry.target);
        }
      });
    }, { root: scrollContainer, threshold: 0.2 });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="w-full h-full bg-[#030008] relative z-10 overflow-hidden flex items-center justify-center px-6 md:px-12">

      {/* Outer ambient glows on page bg */}
      <div className="absolute top-0 left-[10%] w-[500px] h-[300px] bg-purple-900/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[400px] h-[300px] bg-[#1e0b36]/20 blur-[140px] rounded-full pointer-events-none" />

      {/* Main Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[1100px] rounded-[28px] overflow-hidden opacity-0"
        style={{
          background: 'rgba(10, 4, 22, 0.82)',
          border: '1px solid rgba(168, 85, 247, 0.18)',
          backdropFilter: 'blur(32px)',
          boxShadow: '0 0 0 1px rgba(168,85,247,0.08), 0 40px 100px rgba(0,0,0,0.6)',
          minHeight: '480px',
        }}
      >
        {/* Subtle dot grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(168,85,247,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Purple bottom glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[220px] pointer-events-none z-0"
          style={{
            background: 'linear-gradient(to top, rgba(120,40,220,0.55) 0%, rgba(168,85,247,0.25) 40%, transparent 100%)',
            filter: 'blur(4px)',
          }}
        />
        {/* Extra hot-spot glow at bottom center */}
        <div
          className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[500px] h-[200px] pointer-events-none z-0 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(150,60,255,0.55) 0%, transparent 70%)' }}
        />

        {/* Floating pixel blocks */}
        {PIXEL_BLOCKS.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-[4px] pointer-events-none z-[1]"
            style={{
              top: b.top,
              left: b.left,
              width: b.w,
              height: b.h,
              background: `rgba(168, 85, 247, ${b.opacity})`,
              border: `1px solid rgba(168, 85, 247, ${b.opacity * 2})`,
              animation: `testimonial-float-${i % 2 === 0 ? 'up' : 'down'} ${b.dur}s ${b.delay}s infinite ease-in-out`,
            }}
          />
        ))}

        {/* Card Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 md:px-20 py-20 min-h-[480px]">

          {/* Badge pill */}
          <div
            ref={badgeRef}
            className="opacity-0 inline-flex items-center gap-2 mb-10 px-4 py-1.5 rounded-full"
            style={{
              background: 'rgba(30, 11, 54, 0.9)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] block" style={{ boxShadow: '0 0 6px #a855f7' }} />
            <span className="text-[12px] font-mono text-white/70 tracking-[0.2em] uppercase">Ecosystem Validator</span>
          </div>

          {/* Quote */}
          <p
            ref={quoteRef}
            className="opacity-0 text-[22px] md:text-[32px] lg:text-[36px] font-serif italic font-light text-white leading-[1.45] max-w-[820px] mb-8"
            style={{ textShadow: '0 2px 20px rgba(168,85,247,0.15)' }}
          >
            "The liquidity intelligence layer provided by DIEPS radically transformed how we execute swaps. Their continuous real-time graph aggregation is unmatched in the entire Sui ecosystem."
          </p>

          {/* Meta */}
          <div ref={metaRef} className="opacity-0 mb-10">
            <span className="text-[13px] font-mono text-white/35 uppercase tracking-[0.25em]">
              Decentralized Finance Automation
            </span>
          </div>


        </div>
      </div>

      <style>{`
        @keyframes testimonial-float-up {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes testimonial-float-down {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-1deg); }
        }
      `}</style>
    </section>
  );
};
