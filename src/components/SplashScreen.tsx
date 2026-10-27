import React, { useEffect, useState } from 'react';
import { Logo } from './Logo.tsx';
import { TopoPattern, WAVE_TOP_FILL } from './Decor.tsx';

export type SplashMode = 'login' | 'app';

interface SplashScreenProps {
  /** true → mulai animasi keluar (App menahan sampai boot & verifikasi token selesai) */
  ready: boolean;
  /** tujuan setelah splash — menentukan gaya transisi */
  mode: SplashMode;
  onDone: () => void;
}

/* ── timing ──────────────────────────────────────────────────────────────
   login : panel navy menyusut tepat jadi header LoginScreen (30vh) → mulus
   app   : hero dashboard juga navy, jadi cukup cross-fade lembut          */
const EXIT_LOGIN_MS = 820;
const EXIT_APP_MS = 620;
const CONTENT_OUT_MS = 320;

export const SplashScreen: React.FC<SplashScreenProps> = ({ ready, mode, onDone }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (ready) setLeaving(true);
  }, [ready]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(onDone, (mode === 'login' ? EXIT_LOGIN_MS : EXIT_APP_MS) + 40);
    return () => window.clearTimeout(t);
  }, [leaving, mode, onDone]);

  const collapsing = mode === 'login';

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] bg-navy"
      style={{
        height: collapsing ? (leaving ? '30vh' : '100vh') : '100vh',
        opacity: !collapsing && leaving ? 0 : 1,
        transition: `height ${EXIT_LOGIN_MS}ms cubic-bezier(0.65, 0, 0.35, 1), opacity ${EXIT_APP_MS}ms ease`,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      {/* ═══ LATAR ═══ (di-clip sendiri supaya tidak bocor saat panel menyusut) */}
      <div className="absolute inset-0 overflow-hidden">
        <TopoPattern />
        {!collapsing && (
          <>
            <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl" />
            <div className="absolute -bottom-16 -left-24 h-64 w-64 rounded-full bg-white/[0.05] blur-3xl" />
          </>
        )}
      </div>

      {/* ═══ LOGO — tepat di tengah layar, sama seperti splash native ═══ */}
      <div
        className="absolute inset-x-0 top-1/2 flex justify-center"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? 'translateY(-50%) scale(0.92)' : 'translateY(-50%) scale(1)',
          transition: `opacity ${CONTENT_OUT_MS}ms ease, transform ${CONTENT_OUT_MS}ms ease`,
        }}
      >
        <div className="relative flex items-center justify-center">
          <span className="splash-halo absolute h-52 w-52 rounded-full border border-white/25" />
          <Logo className="splash-logo relative h-40 w-40 drop-shadow-[0_18px_40px_rgba(0,0,0,0.35)]" />
        </div>
      </div>

      {/* ═══ WORDMARK ═══ */}
      <div
        className="absolute inset-x-0 top-[calc(50%+112px)] flex flex-col items-center px-10 text-center"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? 'translateY(-8px) scale(0.96)' : 'none',
          transition: `opacity ${CONTENT_OUT_MS}ms ease, transform ${CONTENT_OUT_MS}ms ease`,
        }}
      >
        <h1 className="splash-item text-[26px] font-extrabold leading-none tracking-[0.2em] text-white">
          Go-PKL
        </h1>
        <div
          className="splash-divider mt-4 h-[3px] w-12 rounded-full bg-white/40"
          style={{ animationDelay: '380ms' }}
        />
        <p
          className="splash-item mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55"
          style={{ animationDelay: '520ms' }}
        >
          Portal Magang Siswa
        </p>
      </div>

      <p
        className="splash-item absolute inset-x-0 bottom-9 text-center text-[10px] font-semibold tracking-[0.14em] text-white/35"
        style={{ animationDelay: '700ms' }}
      >
      </p>

      {/* ═══ WAVE ═══ — identik dengan wave header LoginScreen, jadi saat
          panel menyusut ke 30vh tepinya menyatu tanpa terlihat jahitan */}
      <svg
        className="absolute left-0 top-[calc(100%-8px)] h-[90px] w-full"
        viewBox="0 0 1440 190"
        preserveAspectRatio="none"
      >
        <path d={WAVE_TOP_FILL} fill="var(--theme-navy)" />
      </svg>
    </div>
  );
};
