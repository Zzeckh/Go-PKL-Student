import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check, LogIn,
} from 'lucide-react';
import { setToken, saveUser } from '../utils/auth';

/* ⚠️ Sesuaikan dengan path asli di routes/authRoutes.js backend */
const LOGIN_URL = '/api/auth/login';

type Stage = 'splash' | 'loading' | 'start' | 'login';

/* ── Posisi fluid per stage ──
   login/loading: fluid hanya ±1/3 layar (30%), tidak setengah */
const FLUID_POS: Record<Stage, { top: string; bottom: string }> = {
  splash:  { top: '0%',  bottom: '0%'  },  // full
  loading: { top: '70%', bottom: '0%'  },  // fluid 30% di BAWAH
  start:   { top: '0%',  bottom: '0%'  },  // full lagi
  login:   { top: '0%',  bottom: '70%' },  // fluid 30% di ATAS
};

/* ── Kurva S halus ala referensi ── */
const CURVE = 'M0,96 C240,40 480,40 720,96 C960,150 1200,150 1440,96';
/* navy di ATAS kurva (untuk tepi bawah fluid) */
const WAVE_TOP_FILL = `${CURVE} L1440,0 L0,0 Z`;
/* navy di BAWAH kurva (untuk tepi atas fluid) */
const WAVE_BOTTOM_FILL = `${CURVE} L1440,190 L0,190 Z`;

/* ── Pola topographic beranimasi ── */
const TopoPattern: React.FC = () => (
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
   SPLASH → LOADING → START → LOGIN
   Satu fluid yang bergerak antar stage
   ══════════════════════════════════════════════════════ */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [stage, setStage] = useState<Stage>('splash');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Choreography otomatis: splash → loading → start ── */
  useEffect(() => {
    if (stage === 'splash') {
      const t = setTimeout(() => setStage('loading'), 1400);
      return () => clearTimeout(t);
    }
    if (stage === 'loading') {
      const t = setTimeout(() => setStage('start'), 1800);
      return () => clearTimeout(t);
    }
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

      if (user?.role && user.role !== 'intern') {
        throw new Error('Aplikasi ini khusus role siswa. Role lain silakan pakai aplikasi web.');
      }

      setToken(token, remember);
      saveUser(user, remember);
      onSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">

      {/* ═══ LAPISAN FLUID (bergerak antar stage) ═══ */}
      <div
        className="absolute inset-x-0 z-0 bg-navy transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ top: FLUID_POS[stage].top, bottom: FLUID_POS[stage].bottom }}
      >
        {/* pola di-clip di dalam fluid */}
        <div className="absolute inset-0 overflow-hidden">
          <TopoPattern />
        </div>

        {/* tepi ATAS fluid (muncul saat fluid di bawah / loading) */}
        <svg
          className="absolute bottom-full left-0 w-full h-[90px]"
          viewBox="0 0 1440 190"
          preserveAspectRatio="none"
        >
          <path d={WAVE_BOTTOM_FILL} fill="var(--theme-navy)" />
        </svg>

        {/* tepi BAWAH fluid (muncul saat fluid di atas / login) */}
        <svg
          className="absolute top-full left-0 w-full h-[90px]"
          viewBox="0 0 1440 190"
          preserveAspectRatio="none"
        >
          <path d={WAVE_TOP_FILL} fill="var(--theme-navy)" />
        </svg>
      </div>

      {/* ═══ STAGE: SPLASH (full fluid) ═══ */}
      {stage === 'splash' && (
        <div key="splash" className="absolute inset-0 z-10 flex flex-col items-center justify-center rise-in">
          <div className="w-20 h-20 rounded-[22px] bg-white/15 border border-white/20 flex items-center justify-center text-white font-extrabold text-3xl">
            Go
          </div>
          <h1 className="text-white text-3xl font-extrabold mt-4 tracking-tight">Go-PKL</h1>
          <p className="text-white/60 text-sm font-semibold mt-1">Portal Magang Siswa</p>
        </div>
      )}

      {/* ═══ STAGE: LOADING (fluid 30% di bawah) ═══ */}
      {stage === 'loading' && (
        <div
          key="loading"
          className="absolute inset-x-0 top-0 h-[70%] z-10 flex flex-col items-center justify-center rise-in"
          style={{ animationDelay: '250ms' }}
        >
          <Loader2 className="w-8 h-8 text-navy animate-spin" />
          <p className="text-sm font-bold text-navy mt-3">Menyiapkan pengalaman...</p>
          <p className="text-[11px] font-semibold text-navy/50 mt-1">Absensi · Logbook · Perizinan</p>
        </div>
      )}

      {/* ═══ STAGE: START (full fluid + tombol Mulai) ═══ */}
      {stage === 'start' && (
        <div key="start" className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 rise-in">
          <div className="w-16 h-16 rounded-[18px] bg-white/15 border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl">
            Go
          </div>
          <h1 className="text-white text-3xl font-extrabold mt-4 tracking-tight text-center">
            Selamat Datang
          </h1>
          <p className="text-white/70 text-sm font-semibold mt-2 text-center leading-relaxed">
            Absensi GPS, logbook harian, dan perizinan PKL dalam satu genggaman.
          </p>
          <button
            onClick={() => setStage('login')}
            className="mt-10 bg-white text-navy rounded-full px-10 py-3.5 text-sm font-extrabold shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            Mulai <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══ STAGE: LOGIN (fluid 30% di atas, form di bawah) ═══ */}
      {stage === 'login' && (
        <>
          {/* branding di atas fluid */}
          <div key="brand" className="absolute top-6 left-6 z-10 flex items-center gap-3 rise-in">
            <div className="w-11 h-11 rounded-[12px] bg-white/15 border border-white/20 flex items-center justify-center text-white font-extrabold text-base">
              Go
            </div>
            <div>
              <p className="text-white font-extrabold leading-tight">Go-PKL</p>
              <p className="text-white/60 text-[11px] font-semibold">Portal Magang Siswa</p>
            </div>
          </div>

          {/* form mulai DI BAWAH wave (30% + 72px) biar tidak tertimpa */}
          <div
            key="form"
            className="absolute inset-x-0 bottom-0 top-[calc(30%+72px)] z-10 overflow-y-auto rise-in"
          >
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <h1 className="text-2xl font-extrabold text-navy tracking-tight">Masuk</h1>
                <div className="w-10 h-[3px] bg-steel rounded-full mt-1.5" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1">
                  Email
                </label>
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
                <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1">
                  Password
                </label>
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
        </>
      )}
    </div>
  );
};