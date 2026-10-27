import React, { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check, LogIn,
} from 'lucide-react';
import { authService } from '../services/auth';
import { clearAuth } from '../utils/auth';
import { Logo } from './Logo';
import { TopoPattern, WAVE_TOP_FILL } from './Decor';

interface LoginScreenProps {
  onSuccess: (user: any) => void;
  /** false = masih di balik splash: header ditahan dulu, lalu muncul halus
      tepat saat panel splash selesai menyusut. */
  intro?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, intro = true }) => {
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
      const user = await authService.login(email, password, remember);

      /* Aplikasi mobile ini KHUSUS siswa — role lain diarahkan ke web */
      if (user.role !== 'student') {
        clearAuth();
        throw new Error('Aplikasi ini khusus role siswa. Role lain silakan pakai aplikasi web.');
      }

      onSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-0 bg-navy h-[30%]">
        <div className="absolute inset-0 overflow-hidden">
          <TopoPattern />
        </div>
        <svg className="block absolute left-0 w-full h-[90px] top-[calc(100%-8px)]" viewBox="0 0 1440 190" preserveAspectRatio="none">
          <path d={WAVE_TOP_FILL} fill="var(--theme-navy)" />
        </svg>
      </div>

      <div className={`absolute inset-x-0 top-0 z-20 h-[92px] pointer-events-none ${intro ? 'header-in' : 'opacity-0'}`}>
        <div className="absolute top-6 right-6">
          <Logo className="w-11 h-11 drop-shadow-md" />
        </div>
        <div className="absolute top-6 left-6 h-11 flex flex-col justify-center">
          <p className="text-white font-extrabold leading-tight whitespace-nowrap">Go-PKL</p>
          <p className="text-white/60 text-[11px] font-semibold whitespace-nowrap">Portal Magang Siswa</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[calc(30%+72px)] overflow-y-auto scrollbar-none stage-enter">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-extrabold text-navy tracking-tight">Masuk</h1>
            <div className="w-10 h-[3px] bg-steel rounded-full mt-1.5" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1">Email</label>
            <div className="flex items-center gap-2.5 border-b border-mist focus-within:border-steel transition-colors py-2.5">
              <Mail className="w-4 h-4 text-navy/40 shrink-0" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nama@siswa.sch.id"
                className="flex-1 bg-transparent text-sm font-semibold text-navy outline-none placeholder:text-navy/30" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1">Password</label>
            <div className="flex items-center gap-2.5 border-b border-mist focus-within:border-steel transition-colors py-2.5">
              <Lock className="w-4 h-4 text-navy/40 shrink-0" />
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="flex-1 bg-transparent text-sm font-semibold text-navy outline-none placeholder:text-navy/30" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="text-navy/40 hover:text-navy transition-colors" aria-label="Tampilkan password">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setRemember(!remember)} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors ${
                remember ? 'bg-navy border-navy' : 'bg-white border-mist'
              }`}>{remember && <Check className="w-3 h-3 text-white" />}</span>
              <span className="text-xs font-semibold text-navy/70">Ingat saya</span>
            </button>
            <button type="button" className="text-xs font-bold text-steel hover:underline">Lupa password?</button>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[16px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-600 leading-relaxed">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-navy text-white rounded-full py-3.5 text-sm font-bold hover:bg-navy/90 active:scale-[0.98] transition-all shadow-md shadow-navy/25 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Memeriksa...</>) : (<><LogIn className="w-4 h-4" /> Masuk</>)}
          </button>
          <p className="text-center text-[11px] font-semibold text-navy/50">Belum punya akun? Akun dibuat oleh admin sekolah.</p>
        </form>
      </div>
    </div>
  );
};