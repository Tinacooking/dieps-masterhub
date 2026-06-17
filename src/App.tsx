import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Hero } from './components/landing/Hero';
import { About } from './components/landing/About';
import { Services } from './components/landing/Services';
import { Projects } from './components/landing/Projects';
import { Testimonials } from './components/landing/Testimonials';
import { Contact } from './components/landing/Contact';
import { Footer } from './components/landing/Footer';
import { SwapperSection } from './components/swapper/SwapperSection';
import { LoadingScreen } from './components/landing/LoadingScreen';
import { MathAlgorithms } from './components/landing/MathAlgorithms';

function LandingPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);
  const isScrolling = useRef(false);
  const totalSections = 7; // Hero, About, Services, Math, Projects, Testimonials, Contact+Footer

  useEffect(() => {
    const checkResponsive = () => {
      setIsDesktop(window.innerWidth >= 1024 && window.innerHeight >= 650);
    };
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling.current) return;

      if (e.deltaY > 60) {
        if (activeSection < totalSections - 1) {
          isScrolling.current = true;
          setActiveSection(prev => prev + 1);
          setTimeout(() => isScrolling.current = false, 1200);
        }
      } else if (e.deltaY < -60) {
        if (activeSection > 0) {
          isScrolling.current = true;
          setActiveSection(prev => prev - 1);
          setTimeout(() => isScrolling.current = false, 1200);
        }
      }
    };

    const container = document.getElementById('landing-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [activeSection, isDesktop]);

  const touchStart = useRef(0);
  useEffect(() => {
    if (!isDesktop) return;
    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (isScrolling.current) return;
      const touchEnd = e.touches[0].clientY;
      const diff = touchStart.current - touchEnd;

      if (diff > 50) {
        if (activeSection < totalSections - 1) {
          isScrolling.current = true;
          setActiveSection(prev => prev + 1);
          setTimeout(() => isScrolling.current = false, 1000);
        }
      } else if (diff < -50) {
        if (activeSection > 0) {
          isScrolling.current = true;
          setActiveSection(prev => prev - 1);
          setTimeout(() => isScrolling.current = false, 1000);
        }
      }
    };

    const container = document.getElementById('landing-container');
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [activeSection, isDesktop]);

  // Parallax Scale Effect for Sections (Desktop only)
  useEffect(() => {
    if (!isDesktop) return;
    const sections = document.querySelectorAll('.section-inner');
    sections.forEach((section, index) => {
      if (index === activeSection) {
        gsap.fromTo(section,
          { scale: 1.15, opacity: 0.8 },
          { scale: 1.0, opacity: 1, duration: 1.5, ease: 'power3.out' }
        );
      } else {
        // Reset scale/opacity for inactive sections slightly
        gsap.to(section, { scale: 0.95, opacity: 0.5, duration: 1.0, ease: 'power2.out' });
      }
    });
  }, [activeSection]);

  const handleLaunch = () => {
    navigate('/app');
  };

  return (
    <div id="landing-container" className={`bg-[#030008] w-full text-white font-body selection:bg-[#a855f7]/30 ${isDesktop ? 'h-[100svh] overflow-hidden' : 'min-h-[100svh] relative flex flex-col'}`}>
      <div
        className={`w-full ${isDesktop ? 'h-full transition-transform duration-[1200ms] ease-[cubic-bezier(0.645,0.045,0.355,1.000)]' : 'flex flex-col'}`}
        style={isDesktop ? { transform: `translateY(-${activeSection * 100}svh)` } : undefined}
      >
        <div className={`w-full ${isDesktop ? 'h-[100svh] overflow-hidden' : 'min-h-[100svh] relative overflow-hidden'} flex-shrink-0 relative`}>
          <div className="section-inner w-full h-full origin-center">
            <Hero onLaunch={handleLaunch} />
          </div>
        </div>

        <div className={`w-full ${isDesktop ? 'h-[100svh] overflow-hidden' : 'min-h-[100svh] relative overflow-hidden py-10'} flex items-center bg-[#030008] flex-shrink-0 relative`}>
          <div className="section-inner w-full h-full origin-center">
            <About />
          </div>
        </div>

        <div className={`w-full ${isDesktop ? 'h-[100svh] overflow-hidden' : 'min-h-[100svh] relative overflow-hidden py-10'} flex items-center bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex-shrink-0 relative`}>
          <div className="section-inner w-full h-full origin-center">
            <Services />
          </div>
        </div>

        <div className={`w-full ${isDesktop ? 'h-[100svh] overflow-hidden' : 'min-h-[100svh] relative overflow-hidden py-10'} flex items-center bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.6)] flex-shrink-0 relative`}>
          <div className="section-inner w-full h-full origin-center">
            <MathAlgorithms />
          </div>
        </div>

        <div className={`w-full ${isDesktop ? 'h-[100svh] overflow-hidden' : 'min-h-[100svh] relative overflow-hidden py-10'} flex items-center bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] flex-shrink-0 relative`}>
          <div className="section-inner w-full h-full origin-center">
            <Projects />
          </div>
        </div>

        <div className={`w-full ${isDesktop ? 'h-[100svh] overflow-hidden' : 'min-h-[100svh] relative overflow-hidden py-10'} flex items-center bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] flex-shrink-0 relative`}>
          <div className="section-inner w-full h-full origin-center">
            <Testimonials />
          </div>
        </div>

        <div className={`w-full ${isDesktop ? 'h-[100svh] overflow-hidden' : 'min-h-[100svh] relative overflow-hidden'} flex flex-col justify-between bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex-shrink-0 relative`}>
          <div className="section-inner w-full h-full origin-center flex flex-col justify-between">
            <div className="flex-grow flex items-center h-full py-10">
              <Contact />
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRoute() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  return (
    <div className="bg-[#030008] h-screen w-full overflow-hidden text-white relative">
      {isAppLoading ? (
        <LoadingScreen mode="app" onComplete={() => setIsAppLoading(false)} />
      ) : (
        <SwapperSection />
      )}
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <LoadingScreen mode="landing" onComplete={() => setIsLoading(false)} />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppRoute />} />
      </Routes>
    </>
  );
}
