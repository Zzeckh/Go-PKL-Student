import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check, LogIn,
  MapPin, BookOpen, FileCheck,
} from 'lucide-react';
import { setToken, saveUser } from '../utils/auth';
import { Logo } from './Logo';

/* ⚠️ Sesuaikan dengan path asli di routes/authRoutes.js backend */
const LOGIN_URL = '/api/auth/login';

type Stage = 'splash' | 'loading' | 'start' | 'login';

/* ── Posisi fluid per stage ──
   splash/start: overhang -120px → tepi wave di luar layar (anti-glitch) */
const FLUID_POS: Record<Stage, { top: string; bottom: string }> = {
  splash:  { top: '-120px', bottom: '-120px' },
  loading: { top: '70%',    bottom: '-120px' },
  start:   { top: '-120px', bottom: '-120px' },
  login:   { top: '0%',     bottom: '70%'    },
};

/* ── Sapaan multibahasa ── */
const GREETINGS = [
  '欢迎',               // Cina
  'ようこそ',           // Jepang
  '환영합니다',         // Korea
  'أهلاً وسهلاً',       // Arab
  'Добро пожаловать',   // Rusia
  'स्वागत है',          // India
  'Welcome',            // Inggris
  'Selamat Datang',     // Indonesia
];

/* ── Steps yang "menyala" seiring progress ── */
const STEPS = [
  { icon: MapPin,    label: 'Absensi',   at: 15 },
  { icon: BookOpen,  label: 'Logbook',   at: 45 },
  { icon: FileCheck, label: 'Perizinan', at: 75 },
];

/* ── Kurva S halus ala referensi ── */
export const CURVE = 'M0,96 C240,40 480,40 720,96 C960,150 1200,150 1440,96';
export const WAVE_TOP_FILL = `${CURVE} L1440,0 L0,0 Z`;
export const WAVE_BOTTOM_FILL = `${CURVE} L1440,190 L0,190 Z`;

/* ── Pola topographic beranimasi ── */
export const TopoPattern: React.FC = () => (
  <svg
    className="absolute inset-0 h-full w-full opacity-[0.12]"
    viewBox="0 0 400 500"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
  >
    <g stroke="#FFFFFF" strokeWidth="1.2">
      <g className="topo-anim">
        <path d="M70 90c40-35 110-30 145 10s25 105-25 125-120 5-145-40 5-60 25-95Z" />
        <path d="M85 105c32-27 88-23 116 9s20 84-20 100-96 4-116-32 4-49 20-77Z" />
        <path d="M100 120c24-20 66-17 87 7s15 63-15 75-72 3-87-24 3-37 15-58Z" />
      </g>
      <g className="topo-anim-rev">
        <path d="M300 300c35-30 95-25 125 8s20 90-22 107-103 4-124-34 6-51 21-81Z" />
        <path d="M315 315c27-23 74-19 97 7s16 70-17 83-80 3-96-27 5-40 16-63Z" />
      </g>
      <g className="topo-anim-slow">
        <path d="M40 330c25-22 70-18 92 6s15 66-16 78-76 3-91-25 5-37 15-59Z" />
      </g>
      <g className="topo-anim-rev-slow">
        <path d="M250 60c20-18 55-15 73 5s12 52-13 62-60 2-72-20 4-29 12-47Z" />
      </g>
    </g>
  </svg>
);

interface LoginScreenProps {
  onSuccess: (user: any) => void;
}

/* ══════════════════════════════════════════════════════
   SPLASH (1,5s) → LOADING (3s) → START → LOGIN
   ══════════════════════════════════════════════════════ */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [stage, setStage] = useState<Stage>('splash');
  const [prevStage, setPrevStage] = useState<Stage | null>(null);
  const exitTimer = useRef<number | null>(null);

  const [greetIndex, setGreetIndex] = useState(0);
  const [percent, setPercent] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Transisi stage dengan crossfade ── */
  const goTo = (next: Stage) => {
    setPrevStage(stage);
    setStage(next);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setPrevStage(null), 450);
  };

  /* ── Choreography: splash 1,5s → loading 3s → start ── */
  useEffect(() => {
    if (stage === 'splash') {
      const t = setTimeout(() => goTo('loading'), 1500);
      return () => clearTimeout(t);
    }
    if (stage === 'loading') {
      setGreetIndex(0);
      setPercent(0);
      const start = Date.now();

      const greet = setInterval(
        () => setGreetIndex(i => Math.min(i + 1, GREETINGS.length - 1)),
        375
      );
      const prog = setInterval(() => {
        const p = Math.min(100, Math.round(((Date.now() - start) / 3000) * 100));
        setPercent(p);
      }, 50);
      const t = setTimeout(() => goTo('start'), 3000);

      return () => { clearInterval(greet); clearInterval(prog); clearTimeout(t); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Email atau password salah.');

      const token = data?.token || data?.accessToken;
      const user = data?.user || data;
      if (!token) throw new Error('Respons login tidak valid.');

      /* Tolak role non-siswa dari backend web (mentor/guru/hubin/admin),
         bukan hanya string 'intern' — role siswa backend adalah 'student'. */
      const STAFF_ROLES = ['mentor', 'teacher', 'hubin', 'super_admin', 'admin'];
      if (user?.role && STAFF_ROLES.includes(user.role)) {
        throw new Error('Aplikasi ini khusus role siswa. Role lain silakan pakai aplikasi web.');
      }

      setToken(token, remember);
      saveUser(user, remember);

      /* langsung pindah — FluidSweep di dashboard yang
         melanjutkan gerakan fluid ke bawah */
      onSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  /* ══════════ VIEW PER STAGE ══════════ */

  const splashView = (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <Logo className="w-36 h-36 drop-shadow-lg splash-logo" />
      <h1 className="text-white text-4xl font-extrabold mt-7 tracking-tight splash-item" style={{ animationDelay: '250ms' }}>
        Go-PKL
      </h1>
      <div className="w-10 h-[3px] bg-white/40 rounded-full mt-3 splash-divider" style={{ animationDelay: '400ms' }} />
      <p className="text-white/60 text-sm font-semibold mt-3 splash-item" style={{ animationDelay: '450ms' }}>
        Portal Magang Siswa
      </p>
      <p className="absolute bottom-8 text-[10px] font-semibold text-white/40 splash-item" style={{ animationDelay: '600ms' }}>
        © 2026 Go-PKL
      </p>
    </div>
  );

  const loadingView = (
    <div className="w-full h-[70%] flex flex-col items-center justify-center px-8">
      <div className="w-16 h-16 rounded-[18px] bg-navy flex items-center justify-center shadow-md shadow-navy/25">
        <Logo className="w-10 h-10" />
      </div>

      <p key={greetIndex} className="greet-swap text-2xl font-extrabold text-navy tracking-tight text-center min-h-[36px] mt-5">
        {GREETINGS[greetIndex]}
      </p>

      <div className="w-full max-w-[264px] mt-6">
        <div className="h-2 bg-mist rounded-full overflow-hidden">
          <div
            className="h-full bg-navy rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] font-semibold text-navy/50">Menyiapkan pengalaman PKL-mu...</p>
          <p className="text-[11px] font-extrabold text-navy tabular-nums">{percent}%</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6">
        {STEPS.map(s => {
          const active = percent >= s.at;
          return (
            <span
              key={s.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all duration-300 ${
                active
                  ? 'bg-navy border-navy text-white shadow-sm scale-105'
                  : 'bg-white border-mist text-navy/40'
              }`}
            >
              <s.icon className="w-3 h-3" /> {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );

  /* ═══ START PAGE — SIMETRIS PENUH DI TENGAH ═══ */
  const startView = (
    <div className="w-full h-full flex flex-col items-center">
      {/* konten tengah simetris */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pt-24">
        <h1
          className="splash-item text-white text-[32px] font-extrabold tracking-tight mt-6"
          style={{ animationDelay: '200ms' }}
        >
          Ayo Mulai!
        </h1>

        <div
          className="splash-item w-10 h-[3px] bg-white/40 rounded-full mt-4"
          style={{ animationDelay: '300ms' }}
        />

        <p
          className="splash-item text-white/60 text-sm font-semibold mt-4 leading-relaxed"
          style={{ animationDelay: '350ms' }}
        >
          Masuk dan mulai langkah magangmu hari ini.
        </p>
      </div>

      {/* CTA bawah */}
      <div
        className="splash-item w-full px-6 pb-[calc(24px+env(safe-area-inset-bottom))]"
        style={{ animationDelay: '450ms' }}
      >
        <button
          onClick={() => goTo('login')}
          className="w-full bg-white text-navy rounded-full py-4 text-sm font-extrabold shadow-lg shadow-black/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Masuk dengan Akun Sekolah <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[11px] font-semibold text-white/50 mt-3">
          Butuh bantuan? Hubungi tim Hubin sekolahmu.
        </p>
      </div>
    </div>
  );

  const loginView = (
    <div className="absolute inset-x-0 bottom-0 top-[calc(30%+72px)] overflow-y-auto scrollbar-none">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Masuk</h1>
          <div className="w-10 h-[3px] bg-steel rounded-full mt-1.5" />
        </div>

        <div>
          <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1">Email</label>
          <div className="flex items-center gap-2.5 border-b border-mist focus-within:border-steel transition-colors py-2.5">
            <Mail className="w-4 h-4 text-navy/40 shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@siswa.sch.id"
              className="flex-1 bg-transparent text-sm font-semibold text-navy outline-none placeholder:text-navy/30"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1">Password</label>
          <div className="flex items-center gap-2.5 border-b border-mist focus-within:border-steel transition-colors py-2.5">
            <Lock className="w-4 h-4 text-navy/40 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="flex-1 bg-transparent text-sm font-semibold text-navy outline-none placeholder:text-navy/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-navy/40 hover:text-navy transition-colors"
              aria-label="Tampilkan password"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setRemember(!remember)} className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors ${
              remember ? 'bg-navy border-navy' : 'bg-white border-mist'
            }`}>
              {remember && <Check className="w-3 h-3 text-white" />}
            </span>
            <span className="text-xs font-semibold text-navy/70">Ingat saya</span>
          </button>
          <button type="button" className="text-xs font-bold text-steel hover:underline">
            Lupa password?
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-[16px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white rounded-full py-3.5 text-sm font-bold hover:bg-navy/90 active:scale-[0.98] transition-all shadow-md shadow-navy/25 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Memeriksa...</>
          ) : (
            <><LogIn className="w-4 h-4" /> Masuk</>
          )}
        </button>

        <p className="text-center text-[11px] font-semibold text-navy/50">
          Belum punya akun? Akun dibuat oleh admin sekolah.
        </p>
      </form>
    </div>
  );

  const VIEWS: Record<Stage, React.ReactNode> = {
    splash: splashView,
    loading: loadingView,
    start: startView,
    login: loginView,
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">

      {/* ═══ LAPISAN FLUID ═══ */}
      <div
        className="absolute inset-x-0 z-0 bg-navy transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ top: FLUID_POS[stage].top, bottom: FLUID_POS[stage].bottom }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <TopoPattern />
        </div>

        <svg
          className="block absolute left-0 w-full h-[90px] bottom-[calc(100%-8px)]"
          viewBox="0 0 1440 190"
          preserveAspectRatio="none"
        >
          <path d={WAVE_BOTTOM_FILL} fill="var(--theme-navy)" />
        </svg>

        <svg
          className="block absolute left-0 w-full h-[90px] top-[calc(100%-8px)]"
          viewBox="0 0 1440 190"
          preserveAspectRatio="none"
        >
          <path d={WAVE_TOP_FILL} fill="var(--theme-navy)" />
        </svg>
      </div>

      {/* ═══ HEADER PERSISTEN (start ↔ login) ═══ */}
      {(stage === 'start' || stage === 'login') && (
        <div className="absolute inset-x-0 top-0 z-20 h-[92px] pointer-events-none header-in">
          <div
            className="absolute top-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ left: stage === 'login' ? 'calc(100% - 68px)' : '24px' }}
          >
            <Logo className="w-11 h-11 drop-shadow-md" />
          </div>

          <div className="absolute top-6 left-6 h-11 flex items-center">
            <div className={`absolute left-0 h-11 flex flex-col justify-center transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              stage === 'start'
                ? 'opacity-100 translate-x-14 scale-100'
                : 'opacity-0 translate-x-6 scale-90 pointer-events-none'
            }`}>
              <p className="text-white font-extrabold leading-tight whitespace-nowrap">Go-PKL</p>
              <p className="text-white/60 text-[11px] font-semibold whitespace-nowrap">Portal Magang Siswa</p>
            </div>

            <button
              onClick={() => goTo('start')}
              className={`relative pointer-events-auto flex items-center gap-2 h-11 px-5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-bold hover:bg-white/20 active:scale-95 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap ${
                stage === 'login'
                  ? 'opacity-100 translate-x-0 scale-100'
                  : 'opacity-0 -translate-x-4 scale-90 pointer-events-none'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
          </div>
        </div>
      )}

      {/* ═══ LAYAR LAMA: fade-out (crossfade) ═══ */}
      {prevStage && prevStage !== stage && prevStage !== 'login' && (
        <div key={`exit-${prevStage}`} className="absolute inset-0 z-10 pointer-events-none stage-exit">
          {VIEWS[prevStage]}
        </div>
      )}

      {/* ═══ LAYAR BARU: fade-in ═══ */}
      <div
        key={`enter-${stage}`}
        className="absolute inset-0 z-10 stage-enter"
        style={{ animationDelay: stage === 'login' ? '900ms' : '0ms' }}
      >
        {VIEWS[stage]}
      </div>
    </div>
  );
};