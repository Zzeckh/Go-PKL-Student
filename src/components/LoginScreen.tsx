import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check, LogIn,
  MapPin, BookOpen, FileCheck,
} from 'lucide-react';
import { setToken, saveUser } from '../utils/auth';
import { Logo } from './Logo';

/* ⚠️ Sesuaikan dengan path asli di routes/authRoutes.js backend */
const LOGIN_URL = '/api/auth/login';

type Stage = 'splash' | 'loading' | 'start' | 'login';

/* ── Posisi fluid per stage (±1/3 layar saat login/loading) ── */
const FLUID_POS: Record<Stage, { top: string; bottom: string }> = {
  splash:  { top: '0%',  bottom: '0%'  },
  loading: { top: '70%', bottom: '0%'  },
  start:   { top: '0%',  bottom: '0%'  },
  login:   { top: '0%',  bottom: '70%' },
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

/* ── Kurva S halus ala referensi ── */
const CURVE = 'M0,96 C240,40 480,40 720,96 C960,150 1200,150 1440,96';
const WAVE_TOP_FILL = `${CURVE} L1440,0 L0,0 Z`;
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
   SPLASH (1,5s) → LOADING (3s) → START → LOGIN
   ══════════════════════════════════════════════════════ */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [stage, setStage] = useState<Stage>('splash');
  const [greetIndex, setGreetIndex] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Choreography: splash 1,5s → loading 3s → start ── */
  useEffect(() => {
    if (stage === 'splash') {
      const t = setTimeout(() => setStage('loading'), 1500);
      return () => clearTimeout(t);
    }
    if (stage === 'loading') {
      setGreetIndex(0);
      const interval = setInterval(
        () => setGreetIndex(i => Math.min(i + 1, GREETINGS.length - 1)),
        375
      );
      const t = setTimeout(() => setStage('start'), 3000);
      return () => { clearInterval(interval); clearTimeout(t); };
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

      {/* ═══ LAPISAN FLUID ═══ */}
      <div
        className="absolute inset-x-0 z-0 bg-navy transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ top: FLUID_POS[stage].top, bottom: FLUID_POS[stage].bottom }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <TopoPattern />
        </div>
        <svg className="absolute bottom-full left-0 w-full h-[90px]" viewBox="0 0 1440 190" preserveAspectRatio="none">
          <path d={WAVE_BOTTOM_FILL} fill="var(--theme-navy)" />
        </svg>
        <svg className="absolute top-full left-0 w-full h-[90px]" viewBox="0 0 1440 190" preserveAspectRatio="none">
          <path d={WAVE_TOP_FILL} fill="var(--theme-navy)" />
        </svg>
      </div>

      {/* ═══ HEADER PERSISTEN (start ↔ login) ═══ */}
      {(stage === 'start' || stage === 'login') && (
        <div className="absolute inset-x-0 top-0 z-20 h-[92px] pointer-events-none header-in">

          {/* logo: kiri saat start, kanan saat login */}
          <div
            className="absolute top-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ left: stage === 'login' ? 'calc(100% - 68px)' : '24px' }}
          >
            <Logo className="w-11 h-11 drop-shadow-md" />
          </div>

          {/* slot KIRI: nama ↔ tombol kembali (morph di tempat) */}
          <div className="absolute top-6 left-6 h-11 flex items-center">
            {/* nama */}
            <div className={`absolute left-0 h-11 flex flex-col justify-center transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              stage === 'start'
                ? 'opacity-100 translate-x-14 scale-100'
                : 'opacity-0 translate-x-6 scale-90 pointer-events-none'
            }`}>
              <p className="text-white font-extrabold leading-tight whitespace-nowrap">Go-PKL</p>
              <p className="text-white/60 text-[11px] font-semibold whitespace-nowrap">Portal Magang Siswa</p>
            </div>

            {/* tombol kembali */}
            <button
              onClick={() => setStage('start')}
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

      {/* ═══ STAGE: SPLASH (1,5 dtk) ═══
          Lingkaran putih dihapus — logo tampil penuh sebesar
          lingkaran itu dulu (w-36 h-36 = 144px) */}
      {stage === 'splash' && (
        <div key="splash" className="absolute inset-0 z-10 flex flex-col items-center justify-center rise-in">
          <Logo className="w-36 h-36 drop-shadow-lg" />
          <h1 className="text-white text-4xl font-extrabold mt-7 tracking-tight">Go-PKL</h1>
          <div className="w-10 h-[3px] bg-white/40 rounded-full mt-3" />
          <p className="text-white/60 text-sm font-semibold mt-3">Portal Magang Siswa</p>
          <p className="absolute bottom-8 text-[10px] font-semibold text-white/40">
            © 2026 Go-PKL
          </p>
        </div>
      )}

      {/* ═══ STAGE: LOADING (3 dtk) ═══ */}
      {stage === 'loading' && (
        <div
          key="loading"
          className="absolute inset-x-0 top-0 h-[70%] z-10 flex flex-col items-center justify-center px-10 rise-in"
          style={{ animationDelay: '200ms' }}
        >
          <p
            key={greetIndex}
            className="greet-swap text-2xl font-extrabold text-navy tracking-tight text-center min-h-[36px]"
          >
            {GREETINGS[greetIndex]}
          </p>

          <div className="w-52 h-1.5 bg-mist rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-navy rounded-full animate-progress" />
          </div>

          <p className="text-[11px] font-semibold text-navy/50 mt-3">
            Menyiapkan pengalaman PKL-mu...
          </p>
        </div>
      )}

      {/* ═══ STAGE: START ═══ */}
      {stage === 'start' && (
        <div key="start" className="absolute inset-0 z-10 flex flex-col rise-in">
          {/* tengah: headline + chips */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pt-20">
            <h1 className="text-white text-4xl font-extrabold tracking-tight">
              Ayo Mulai!
            </h1>
            <p className="text-white/70 text-sm font-semibold mt-3 leading-relaxed">
              Masuk dengan akun sekolahmu dan mulai langkah magangmu hari ini.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-white/80">
                <MapPin className="w-3 h-3" /> Absensi GPS
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-white/80">
                <BookOpen className="w-3 h-3" /> Logbook
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-white/80">
                <FileCheck className="w-3 h-3" /> Perizinan
              </span>
            </div>
          </div>

          {/* bawah: CTA */}
          <div className="p-6 pt-0">
            <button
              onClick={() => setStage('login')}
              className="w-full bg-white text-navy rounded-full py-4 text-sm font-extrabold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Masuk <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[11px] font-semibold text-white/50 mt-3">
              Butuh bantuan? Hubungi tim Hubin sekolahmu.
            </p>
          </div>
        </div>
      )}

      {/* ═══ STAGE: LOGIN ═══ */}
      {stage === 'login' && (
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
      )}
    </div>
  );
};2