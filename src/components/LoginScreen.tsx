import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Check } from 'lucide-react';
import { setToken, saveUser } from '../utils/auth';

/* ⚠️ Sesuaikan dengan path asli di routes/authRoutes.js backend */
const LOGIN_URL = '/api/auth/login';

interface LoginScreenProps {
  onSuccess: (user: any) => void;
}

/* ══════════════════════════════════════════════════════
   LOGIN SCREEN — layout mengikuti wireframe "Sign in"
   ══════════════════════════════════════════════════════ */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
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
    <div className="min-h-screen bg-shell flex flex-col">
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center px-6 py-10">

        {/* ── Logo & identitas ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[14px] bg-navy text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-navy/20 border border-white/20">
            Go
          </div>
          <h1 className="text-2xl font-extrabold text-navy mt-4 tracking-tight">Go-PKL</h1>
          <p className="text-sm font-semibold text-navy/60 mt-1">Portal Magang Siswa</p>
        </div>

        {/* ── Card form (wireframe: sign in) ── */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-navy text-center">Masuk</h2>

          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@siswa.sch.id"
              className="w-full bg-white border border-mist rounded-[16px] px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel transition-colors placeholder:text-navy/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full bg-white border border-mist rounded-[16px] px-4 py-3 pr-12 text-sm font-semibold text-navy outline-none focus:border-steel transition-colors placeholder:text-navy/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition-colors"
                aria-label="Tampilkan password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ── Row: remember me + forgot (wireframe) ── */}
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

          {/* ── Tombol utama (wireframe: big pill button) ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white rounded-[16px] py-3.5 text-sm font-bold hover:bg-navy/90 transition-colors shadow-md shadow-navy/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Memeriksa...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Masuk</>
            )}
          </button>
        </form>

        {/* ── Footer (wireframe: "Are you new? Register") ── */}
        <p className="text-center text-xs font-semibold text-navy/60 mt-6">
          Belum punya akun? Akun dibuat oleh admin sekolah.
        </p>
        <p className="text-center text-[10px] font-semibold text-navy/40 mt-8">
          © 2026 Go-PKL · Portal PKL
        </p>
      </div>
    </div>
  );
};