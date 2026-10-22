import React, { useEffect } from 'react';
import { Logo } from './Logo.tsx';
import { TopoPattern } from './Decor.tsx';

interface SplashScreenProps {
  onDone: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy text-white">
      <TopoPattern />
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        <Logo className="splash-logo mb-7 h-28 w-28 rounded-[2rem] bg-white p-4 shadow-2xl" />
        <div className="splash-divider mb-5 h-px w-24 bg-white/60" />
        <p className="splash-item text-xl font-extrabold tracking-[0.28em]" style={{ animationDelay: '450ms' }}>
          GO-PKL
        </p>
        <p className="splash-item mt-3 text-xs font-medium tracking-[0.18em] text-white/70" style={{ animationDelay: '650ms' }}>
          DIGITAL JOURNAL SYSTEM
        </p>
      </div>
    </main>
  );
};
