import React, { useState } from 'react';
import {
  ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check, LogIn,
} from 'lucide-react';
import { setToken, saveUser } from '../utils/auth';

/* ⚠️ Sesuaikan dengan path asli di routes/authRoutes.js backend */
const LOGIN_URL = '/api/auth/login';

/* ── Kurva S halus ala referensi (pembatas STATIS) ── */
const WAVE_STATIC =
  'M0,96 C240,40 480,40 720,96 C960,150 1200,150 1440,96 L1440,190 L0,190 Z';

/* ── Pola topographic: tiap kelompok lingkaran dianimasikan terpisah ── */
const TopoPattern: React.FC = () => (
  <svg
    className="absolute inset-0 h-full w-full opacity-[0.12]"
    viewBox="0 0 400 500"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
  >
    <g stroke="#FFFFFF" strokeWidth="1.2">
      {/* blob kiri-atas (3 cincin) */}
      <g className="topo-anim">
        <path d="M70 90c40-35 110-30 145 10s25 105-25 125-120 5-145-40 5-60 25-95Z" />
        <path d="M85 105c32-27 88-23 116 9s20 84-20 100-96 4-116-32 4-49 20-77Z" />
        <path d="M100 120c24-20 66-17 87 7s15 63-15 75-72 3-87-24 3-37 15-58Z" />
      </g>
      {/* blob kanan-bawah (2 cincin) */}
      <g className="topo-anim-rev">
        <path d="M300 300c35-30 95-25 125 8s20 90-22 107-103 4-124-34 6-51 21-81Z" />
        <path d="M315 315c27-23 74-19 97 7s16 70-17 83-80 3-96-27 5-40 16-63Z" />
      </g>
      {/* blob kiri-bawah */}
      <g className="topo-anim-slow">
        <path d="M40 330c25-22 70-18 92 6s15 66-16 78-76 3-91-25 5-37 15-59Z" />
      </g>
      {/* blob kanan-atas */}
      <g className="topo-anim-rev-slow">
        <path d="M250 60c20-18 55-15 73 5s12 52-13 62-60 2-72-20 4-29 12-47Z" />
      </g>
    </g>
  </svg>
);

/* ── Pembatas gelombang: STATIS (tidak bergerak) ── */
const Wave: React.FC = () => (
  <svg
    className="absolute bottom-0 left-0 w-full h-[110px]"
    viewBox="0 0 1440 190"
    preserveAspectRatio="none"
    fill="none"
  >
    <path d={WAVE_STATIC} fill="var(--theme-white)" />
  </svg>
);

/* ── Hero navy ── */
const Hero: React.FC = () => (
  <div className="relative h-[38vh] min-h-[260px] bg-navy overflow-hidden shrink-0">
    <TopoPattern />
    {/* Branding */}
    <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
      <div className="w-11 h-11 rounded-[12px] bg-white/15 border border-white/20 flex items-center justify-center text-white font-extrabold text-base">
        Go
      </div>
      <div>
        <p className="text-white font-extrabold leading-tight">Go-PKL</p>
        <p className="text-white/60 text-[11px] font-semibold">Portal Magang Siswa</p>
      </div>
    </div>
    <Wave />
  </div>
);

interface LoginScreenProps {
  onSuccess: (user: any) => void;
}

/* ══════════════════════════════════════════════════════
   LOGIN SCREEN — layout referensi: Welcome → Sign in
   ══════════════════════════════════════════════════════ */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [view, setView] = useState<'welcome' | 'login'>('welcome');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      /* App ini khusus siswa */
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
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── HERO navy + blob beranimasi + pembatas statis ── */}
      <Hero />

      {/* ══════════ VIEW: WELCOME ══════════ */}
      {view === 'welcome' && (
        <div className="flex-1 bg-white flex flex-col p-6">
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">
            Selamat Datang
          </h1>
          <p className="text-sm font-semibold text-navy/60 mt-2 leading-relaxed">
            Absensi GPS, logbook harian, dan perizinan PKL — semua dalam satu genggaman.
          </p>

          <div className="flex-1" />

          <div className="flex items-center justify-end gap-3 pb-2">
            <span className="text-xs font-bold text-navy/60">Lanjutkan</span>
            <button
              onClick={() => setView('login')}
              className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center shadow-md shadow-navy/25 hover:bg-navy/90 active:scale-95 transition-all"
              aria-label="Lanjutkan ke halaman masuk"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════ VIEW: SIGN IN ══════════ */}
      {view === 'login' && (
        <div className="flex-1 bg-white overflow-y-auto">
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
};