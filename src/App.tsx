import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
  const isScrolling = useRef(false);
  const totalSections = 7; // Hero, About, Services, Math, Projects, Testimonials, Contact+Footer

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling.current) return;

      if (e.deltaY > 50) {
        if (activeSection < totalSections - 1) {
          isScrolling.current = true;
          setActiveSection(prev => prev + 1);
          setTimeout(() => isScrolling.current = false, 1000);
        }
      } else if (e.deltaY < -50) {
        if (activeSection > 0) {
          isScrolling.current = true;
          setActiveSection(prev => prev - 1);
          setTimeout(() => isScrolling.current = false, 1000);
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
  }, [activeSection]);

  const touchStart = useRef(0);
  useEffect(() => {
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
  }, [activeSection]);

  const handleLaunch = () => {
    navigate('/app');
  };

  return (
    <div id="landing-container" className="bg-[#030008] h-[100svh] w-full text-white font-body selection:bg-[#a855f7]/30 overflow-hidden">
      <div 
        className="w-full h-full transition-transform duration-[1200ms] ease-[cubic-bezier(0.645,0.045,0.355,1.000)]"
        style={{ transform: `translateY(-${activeSection * 100}svh)` }}
      >
        <div className="w-full h-[100svh] overflow-hidden flex-shrink-0 relative">
          <Hero onLaunch={handleLaunch} />
        </div>

        <div className="w-full h-[100svh] flex items-center bg-[#030008] overflow-hidden flex-shrink-0 relative">
          <About />
        </div>
        
        <div className="w-full h-[100svh] flex items-center bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 relative">
          <Services />
        </div>
        
        <div className="w-full h-[100svh] flex items-center bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.6)] overflow-hidden flex-shrink-0 relative">
          <MathAlgorithms />
        </div>
        
        <div className="w-full h-[100svh] flex items-center bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] overflow-hidden flex-shrink-0 relative">
          <Projects />
        </div>
        
        <div className="w-full h-[100svh] flex items-center bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] overflow-hidden flex-shrink-0 relative">
          <Testimonials />
        </div>
        
        <div className="w-full h-[100svh] flex flex-col justify-between bg-[#030008] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 relative">
          <div className="flex-grow flex items-center h-full">
            <Contact />
          </div>
          <Footer />
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
