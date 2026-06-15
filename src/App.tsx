import React, { useState } from 'react';
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

  const handleLaunch = () => {
    navigate('/app');
  };

  return (
    <div className="bg-[#030008] h-[100svh] overflow-y-auto w-full text-white font-body selection:bg-[#a855f7]/30 snap-y snap-mandatory custom-scrollbar">
      <div className="snap-start snap-always w-full h-[100svh] overflow-hidden">
        <Hero onLaunch={handleLaunch} />
      </div>

      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#030008] overflow-y-auto">
        <About />
      </div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#030008] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <Services />
      </div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#030008] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
        <MathAlgorithms />
      </div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#030008] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <Projects />
      </div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#030008] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <Testimonials />
      </div>
      <div className="snap-start snap-always w-full h-[100svh] flex items-center bg-[#030008] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <Contact />
      </div>
      <div className="snap-start snap-always w-full shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<div className="bg-[#030008] h-screen w-full overflow-hidden text-white"><SwapperSection /></div>} />
      </Routes>
    </>
  );
}
