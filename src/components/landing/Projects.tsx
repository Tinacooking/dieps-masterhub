import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const METRICS = [
  {
    value: '10+',
    label: 'DEXs Monitored',
    countTo: 10,
    suffix: '+',
    size: 200,
    glowSize: 260,
    floatDur: 7.2,
    floatDelay: 0,
    glowIntensity: 0.55,
  },
  {
    value: '400K',
    label: 'Active Pools',
    countTo: 400000,
    prefix: 'Up to ',
    suffix: '',
    size: 240,
    glowSize: 310,
    floatDur: 6.4,
    floatDelay: 0.8,
    glowIntensity: 0.7,
  },
  {
    value: '200ms',
    label: 'Graph Refresh',
    countTo: 200,
    prefix: '< ',
    suffix: 'ms',
    size: 180,
    glowSize: 240,
    floatDur: 8.1,
    floatDelay: 0.4,
    glowIntensity: 0.5,
  },
  {
    value: '99.9%',
    label: 'Execution Safety',
    countTo: 99.9,
    suffix: '%',
    size: 160,
    glowSize: 210,
    floatDur: 6.8,
    floatDelay: 1.2,
    glowIntensity: 0.45,
  },
];

export const Projects = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  const [counts, setCounts] = useState([0, 0, 1000, 0]);

  useEffect(() => {
    const scrollContainer = document.querySelector('.custom-scrollbar') as HTMLElement | null;

    const runAnimations = () => {
      if (animatedRef.current) return;
      animatedRef.current = true;

      gsap.fromTo(leftRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }
      );

      const spheres = rightRef.current?.querySelectorAll('.metric-sphere-wrap');
      if (spheres) {
        gsap.fromTo(Array.from(spheres),
          { opacity: 0, y: 50, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, duration: 1.0, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
        );
      }

      // Count-up
      const obj = { v0: 0, v1: 0, v2: 1000, v3: 0 };
      gsap.to(obj, {
        v0: 10, v1: 400000, v2: 200, v3: 99.9,
        duration: 2.8, ease: 'power2.out', delay: 0.4,
        onUpdate: () => {
          setCounts([
            Math.floor(obj.v0),
            Math.floor(obj.v1),
            Math.floor(obj.v2),
            parseFloat(obj.v3.toFixed(1)),
          ]);
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runAnimations();
          observer.unobserve(entry.target);
        }
      });
    }, { root: scrollContainer, threshold: 0.2 });

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const formatCount = (idx: number) => {
    if (idx === 0) return `${counts[0]}+`;
    if (idx === 1) return `Up to ${counts[1].toLocaleString()}`;
    if (idx === 2) return `< ${counts[2]}ms`;
    if (idx === 3) return `${counts[3]}%`;
    return '';
  };

  return (
    <section
      ref={sectionRef}
      className="w-full h-full bg-[#05050A] relative z-10 overflow-hidden flex items-center"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(120,40,220,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-[20%] w-[600px] h-[300px] rounded-full pointer-events-none blur-[100px]"
        style={{ background: 'rgba(100,30,200,0.06)' }} />

      <div className="adaptive-scale w-full h-full flex items-center justify-center relative z-10">
        <div className="max-w-[1400px] mx-auto w-full px-8 md:px-20 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">

        {/* LEFT — Editorial text */}
        <div ref={leftRef} className="lg:col-span-4 flex flex-col gap-8 opacity-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#a855f7]">Protocol Metrics</span>

          <h2 className="font-display font-bold text-[26px] md:text-[32px] leading-[1.2] text-white">
            DIEPS isn't here to replace the aggregators, it's the layer on top of them.
          </h2>

          <div className="w-12 h-px bg-[#a855f7]/40" />

          <p className="text-[14px] md:text-[16px] text-white leading-relaxed font-body max-w-[420px]">
            By wrapping institutional-grade risk models and intelligent execution into a single plain-English interface, DIEPS has one goal: bring the next million people into Sui and make sure every single one of them actually stays.
          </p>
        </div>

        {/* RIGHT — Metric spheres */}
        <div ref={rightRef} className="lg:col-span-8 flex flex-col justify-center">
          <div className="flex flex-row items-end justify-around gap-4 md:gap-6">
            {METRICS.map((m, i) => (
              <div
                key={m.label}
                className="metric-sphere-wrap opacity-0 flex flex-col items-center gap-0"
                style={{ animationDelay: `${m.floatDelay}s` }}
              >
                {/* Value above line */}
                <div className="mb-3 text-center">
                  <div
                    className="font-display font-bold text-white leading-none"
                    style={{ fontSize: `clamp(16px, ${m.size / 10}px, ${m.size / 7}px)` }}
                  >
                    {formatCount(i)}
                  </div>
                </div>

                {/* Thin vertical guide line */}
                <div
                  className="w-px mb-1"
                  style={{
                    height: `${m.size * 0.18}px`,
                    background: `linear-gradient(to bottom, rgba(168,85,247,0.5), rgba(168,85,247,0.1))`,
                  }}
                />

                {/* Sphere */}
                <div
                  className="relative flex-shrink-0 cursor-default"
                  style={{
                    width: m.size,
                    height: m.size,
                    animation: `sphere-float ${m.floatDur}s ${m.floatDelay}s ease-in-out infinite`,
                  }}
                  onMouseEnter={e => {
                    gsap.to(e.currentTarget, { scale: 1.06, duration: 0.4, ease: 'power2.out' });
                  }}
                  onMouseLeave={e => {
                    gsap.to(e.currentTarget, { scale: 1, duration: 0.5, ease: 'power2.inOut' });
                  }}
                >
                  {/* Outer glow */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, rgba(168,85,247,${m.glowIntensity * 0.3}) 0%, transparent 70%)`,
                      transform: 'scale(1.4)',
                      animation: `sphere-glow-pulse ${m.floatDur * 0.8}s ${m.floatDelay}s ease-in-out infinite`,
                    }}
                  />
                  {/* Sphere body */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `
                        radial-gradient(circle at 35% 30%,
                          #ffffff 0%,
                          rgba(255, 255, 255, 0.98) 12%,
                          rgba(230, 200, 255, 0.9) 32%,
                          rgba(157, 80, 255, ${m.glowIntensity}) 55%,
                          rgba(80, 20, 180, 0.95) 80%,
                          #0d0425 100%
                        )
                      `,
                      boxShadow: `
                        0 0 ${m.size * 0.5}px rgba(168,85,247,${m.glowIntensity * 0.45}),
                        0 0 ${m.size * 0.2}px rgba(168,85,247,${m.glowIntensity * 0.25}),
                        inset -4px -4px 16px rgba(0, 0, 0, 0.6),
                        inset 4px 4px 16px rgba(255, 255, 255, 0.35)
                      `,
                      border: '1px solid rgba(168,85,247,0.25)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                  {/* Inner highlight (glassy sheen) */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: '40%',
                      height: '24%',
                      top: '12%',
                      left: '18%',
                      background: 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
                      filter: 'blur(2px)',
                      transform: 'rotate(-15deg)',
                    }}
                  />
                </div>

                {/* Label below sphere */}
                <div className="mt-4 text-center">
                  <span className="font-mono text-[11px] md:text-[12px] font-bold uppercase tracking-[0.25em] text-purple-200 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                    {m.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      <style>{`
        @keyframes sphere-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }
        @keyframes sphere-glow-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1.4); }
          50%       { opacity: 1;   transform: scale(1.55); }
        }
      `}</style>
    </section>
  );
};
