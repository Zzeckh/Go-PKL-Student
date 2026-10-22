import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, BookOpen, CheckCircle2, Clock,
  Mail, Phone, Lock, IdCard, LogOut, MapPin,
  Pencil, Check, X, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { TopoPattern } from './Decor';
import { dashboardService, type DashboardStats } from '../services/dashboard';
import { profileService } from '../services/profile';

interface ProfileViewProps {
  user: any;
  onLogout: () => void;
  onUserUpdate?: (u: any) => void;
}

type EditingRow = 'email' | 'wa' | null;

const fmtHours = (h: number) => String(h).replace('.', ',');

const fmtWa = (v: string | null | undefined): string => {
  if (!v) return 'Belum diisi';
  return v.startsWith('0') ? v : `0${v}`;
};

const EditTrigger: React.FC<{ onClick: () => void; disabled?: boolean }> = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label="Ubah"
    className="shrink-0 w-8 h-8 rounded-[10px] bg-navy/10 text-navy flex items-center justify-center active:scale-90 transition-all disabled:opacity-40"
  >
    <Pencil className="w-3.5 h-3.5" />
  </button>
);

/* ══════════════════════════════════════════════════════
   PROFILE VIEW — identitas satu layar, ukuran nyaman.
   Root min-h-full + sheet flex-1 → putih menutup sampai
   tepi bawah (belakang nav), tanpa pita kosong & scroll.
   Form password di bottom-sheet.
   ══════════════════════════════════════════════════════ */
export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, onUserUpdate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(user);
  const [lastPropUser, setLastPropUser] = useState<any>(user);
  if (user !== lastPropUser) {
    setLastPropUser(user);
    setProfile(user);
  }

  const loadStats = useCallback(async () => {
    setStatsError(null);
    try {
      const s = await dashboardService.getStats();
      setStats(s);
    } catch (err: any) {
      setStatsError(err?.message || 'Gagal memuat statistik.');
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const [editing, setEditing] = useState<EditingRow>(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<EditingRow>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [waDraft, setWaDraft] = useState('');

  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const startEdit = (row: EditingRow) => {
    setRowError(null);
    setSavedFlash(null);
    if (row === 'email') setEmailDraft(profile?.email || '');
    if (row === 'wa') setWaDraft(profile?.whatsapp ? fmtWa(profile.whatsapp) : '');
    setEditing(row);
  };

  const cancelEdit = () => { setEditing(null); setRowError(null); };

  const flashSaved = (row: EditingRow) => {
    setSavedFlash(row);
    window.setTimeout(() => setSavedFlash((cur) => (cur === row ? null : cur)), 2000);
  };

  const commitUser = (u: any) => { setProfile(u); onUserUpdate?.(u); };

  const refreshMe = async () => {
    try {
      const me = await profileService.getMe();
      commitUser(me);
      return me;
    } catch { return null; }
  };

  const saveProfile = async (row: 'email' | 'wa') => {
    setRowError(null);
    if (row === 'email') {
      const v = emailDraft.trim();
      if (!v) return setRowError('Email tidak boleh kosong');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setRowError('Format email tidak valid');
    } else {
      const v = waDraft.trim();
      if (!/^\+?[0-9]{9,15}$/.test(v)) return setRowError('Nomor WhatsApp tidak valid (9–15 digit)');
    }
    setSaving(true);
    try {
      const payload = row === 'email' ? { email: emailDraft.trim() } : { whatsapp: waDraft.trim() };
      const updated = await profileService.updateProfile(payload);
      commitUser(updated);
      await refreshMe();
      setEditing(null);
      flashSaved(row);
    } catch (err: any) {
      setRowError(err?.message || 'Gagal menyimpan. Coba lagi.');
    } finally { setSaving(false); }
  };

  const submitPassword = async () => {
    setPwError(null);
    if (!pwCurrent) return setPwError('Password saat ini wajib diisi');
    if (pwNew.length < 6) return setPwError('Password baru minimal 6 karakter');
    if (pwNew !== pwConfirm) return setPwError('Konfirmasi password tidak sama');
    setSaving(true);
    try {
      await profileService.changePassword({ currentPassword: pwCurrent, newPassword: pwNew });
      setPwSuccess(true);
      window.setTimeout(onLogout, 1500);
    } catch (err: any) {
      setPwError(err?.message || 'Gagal mengubah password.');
    } finally { setSaving(false); }
  };

  const openPassword = () => {
    setPwError(null); setPwSuccess(false);
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setShowCur(false); setShowNew(false); setShowConf(false);
    setPwOpen(true);
  };

  const closePassword = () => { if (!saving) { setPwOpen(false); setPwError(null); } };

  const fullName = profile?.name || 'Siswa PKL';
  const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const kelas = profile?.className || '—';
  const major = profile?.major || '—';
  const email = profile?.email || '—';
  const company: string = profile?.companyName || 'Belum ditentukan';
  const companyAddress: string = profile?.companyAddress || 'Alamat belum diatur';
  const teacherName: string = profile?.teacherName || '—';
  const mentorName: string = profile?.mentorName || 'Belum ditentukan';

  const guruInitials = teacherName !== '—'
    ? teacherName.replace(/,.*$/, '').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '—';
  const mentorInitials = mentorName !== 'Belum ditentukan'
    ? mentorName.replace(/,.*$/, '').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '—';

  const pwInput = (props: { placeholder: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void; }) => (
    <div className="relative">
      <input
        type={props.show ? 'text' : 'password'}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={saving || pwSuccess}
        className="w-full rounded-[12px] border border-mist bg-shell/50 px-3.5 py-3 pr-11 text-[13px] font-semibold text-navy placeholder:text-navy/30 focus:border-navy outline-none disabled:opacity-60"
      />
      <button
        type="button" onClick={props.toggle}
        aria-label={props.show ? 'Sembunyikan' : 'Tampilkan'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 active:scale-90 transition-transform"
      >
        {props.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="relative -mx-5 min-h-full flex flex-col">
      {/* ═══ HERO — identitas + strip statistik ═══ */}
      <div className="rise-in relative bg-navy px-5 pt-6 pb-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden"><TopoPattern /></div>

        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-white/15 border-[3px] border-white/25 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-black/20">
              {initials}
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-green-400 border-[3px] border-navy" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-[19px] font-extrabold tracking-tight leading-tight truncate">{fullName}</h1>
            <p className="text-white/65 text-[11px] font-semibold mt-0.5 truncate">{kelas} · {major}</p>
            <div className="flex items-center gap-1.5 mt-2 min-w-0 flex-wrap">
              {profile?.academicYear && (
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[9px] font-bold text-white/80 flex items-center gap-1">
                  <IdCard className="w-3 h-3" /> T.A. {profile.academicYear}
                </span>
              )}
              <span className="shrink min-w-0 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[9px] font-bold text-white/80 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{company}</span>
              </span>
            </div>
          </div>
        </div>

        {/* strip statistik */}
        <div className="relative mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-[18px] bg-white/10 border border-white/15 py-3.5">
          <div className="flex flex-col items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-white/60" />
            <p className="text-[18px] font-extrabold text-white tabular-nums leading-none">{stats ? stats.totalLogbook : '–'}</p>
            <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-wide">Logbook</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-white/60" />
            <p className="text-[18px] font-extrabold text-white tabular-nums leading-none">{stats ? stats.attendanceCount : '–'}</p>
            <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-wide">Hadir</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-white/60" />
            <p className="text-[18px] font-extrabold text-white tabular-nums leading-none">{stats ? fmtHours(stats.totalHours) : '–'}</p>
            <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-wide">Jam</p>
          </div>
        </div>

        {statsError && (
          <button onClick={loadStats} className="relative mt-2 text-[10px] font-bold text-white/70 underline">
            Muat ulang statistik
          </button>
        )}
      </div>

      {/* ═══ WHITE SHEET — flex-1: melar sampai tepi bawah layar ═══ */}
      <div className="relative -mt-10 flex-1 bg-white rounded-t-[32px] px-5 pt-6 pb-24 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">

        {/* ── KARTU AKUN ── */}
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm divide-y divide-mist/60" style={{ animationDelay: '100ms' }}>

          {/* Email */}
          <div className="px-4 py-3.5">
            {editing === 'email' ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="email" value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="email@contoh.com"
                    disabled={saving} autoFocus
                    className="flex-1 min-w-0 rounded-[12px] border border-mist bg-shell/50 px-3.5 py-2.5 text-[12px] font-semibold text-navy placeholder:text-navy/30 focus:border-navy outline-none disabled:opacity-60"
                  />
                  <button onClick={() => saveProfile('email')} disabled={saving} aria-label="Simpan"
                    className="shrink-0 w-9 h-9 rounded-[10px] bg-navy text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={cancelEdit} disabled={saving} aria-label="Batal"
                    className="shrink-0 w-9 h-9 rounded-[10px] border border-mist text-navy/60 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {rowError && <p className="text-[10px] font-bold text-red-500">{rowError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-navy/5 text-navy/70 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-wide">Email</p>
                  <p className="text-[13px] font-bold text-navy leading-tight mt-0.5 truncate">{email}</p>
                  {savedFlash === 'email' && <p className="text-[10px] font-bold text-green-600 mt-0.5">Tersimpan</p>}
                </div>
                <EditTrigger onClick={() => startEdit('email')} disabled={saving} />
              </div>
            )}
          </div>

          {/* WhatsApp */}
          <div className="px-4 py-3.5">
            {editing === 'wa' ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="tel" inputMode="tel" value={waDraft}
                    onChange={(e) => setWaDraft(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    disabled={saving} autoFocus
                    className="flex-1 min-w-0 rounded-[12px] border border-mist bg-shell/50 px-3.5 py-2.5 text-[12px] font-semibold text-navy placeholder:text-navy/30 focus:border-navy outline-none disabled:opacity-60"
                  />
                  <button onClick={() => saveProfile('wa')} disabled={saving} aria-label="Simpan"
                    className="shrink-0 w-9 h-9 rounded-[10px] bg-navy text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={cancelEdit} disabled={saving} aria-label="Batal"
                    className="shrink-0 w-9 h-9 rounded-[10px] border border-mist text-navy/60 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {rowError && <p className="text-[10px] font-bold text-red-500">{rowError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-navy/5 text-navy/70 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-wide">WhatsApp</p>
                  <p className={`text-[13px] font-bold leading-tight mt-0.5 truncate ${profile?.whatsapp ? 'text-navy' : 'text-navy/40'}`}>
                    {fmtWa(profile?.whatsapp)}
                  </p>
                  {savedFlash === 'wa' && <p className="text-[10px] font-bold text-green-600 mt-0.5">Tersimpan</p>}
                </div>
                <EditTrigger onClick={() => startEdit('wa')} disabled={saving} />
              </div>
            )}
          </div>

          {/* Password */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-navy/5 text-navy/70 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-wide">Password</p>
              <p className="text-[13px] font-bold text-navy leading-tight mt-0.5 tracking-widest">••••••••</p>
            </div>
            <EditTrigger onClick={openPassword} disabled={saving} />
          </div>
        </div>

        {/* ── KARTU MAGANG — tempat magang + guru pembimbing + mentor ── */}
        <div className="rise-in mt-3 bg-white rounded-[20px] border border-mist/60 shadow-sm divide-y divide-mist/60" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-navy text-white flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-wide">Tempat Magang</p>
              <p className="text-[13px] font-bold text-navy leading-tight mt-0.5 truncate">{company}</p>
              <p className="text-[10px] font-semibold text-navy/50 truncate">{companyAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-10 h-10 rounded-full bg-shell border border-mist/60 text-navy text-[10px] font-extrabold flex items-center justify-center shrink-0">
              {guruInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-wide">Guru Pembimbing</p>
              <p className="text-[13px] font-bold text-navy leading-tight mt-0.5 truncate">{teacherName}</p>
            </div>
          </div>

          {/* ★ BARU: card nama mentor — di bawah guru pembimbing ★ */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-10 h-10 rounded-full bg-shell border border-mist/60 text-navy text-[10px] font-extrabold flex items-center justify-center shrink-0">
              {mentorInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-wide">Mentor Lapangan</p>
              <p className={`text-[13px] font-bold leading-tight mt-0.5 truncate ${profile?.mentorName ? 'text-navy' : 'text-navy/40'}`}>
                {mentorName}
              </p>
            </div>
          </div>
        </div>

        {/* ── LOGOUT ── */}
        <button
          onClick={onLogout}
          className="rise-in mt-4 w-full border-2 border-navy/15 text-navy rounded-[16px] py-3.5 text-[13px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          style={{ animationDelay: '300ms' }}
        >
          <LogOut className="w-4 h-4" /> Keluar dari Akun
        </button>

        <p className="rise-in mt-3 text-center text-[10px] font-semibold text-navy/40" style={{ animationDelay: '350ms' }}>
          Go-PKL v1.0 · © 2026
        </p>
      </div>

      {/* ═══ BOTTOM SHEET — ganti password ═══ */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-navy/40" onClick={closePassword} />
          <div className="rise-in relative w-full bg-white rounded-t-[28px] px-5 pt-3 pb-8 shadow-[0_-12px_40px_rgba(10,25,60,0.25)]">
            <div className="mx-auto w-10 h-1 rounded-full bg-mist" />
            <div className="flex items-center justify-between mt-4">
              <p className="text-[15px] font-extrabold text-navy">Ganti Password</p>
              <button
                onClick={closePassword} disabled={saving} aria-label="Tutup"
                className="w-8 h-8 rounded-full bg-shell border border-mist/60 text-navy/60 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwSuccess ? (
              <div className="mt-4 rounded-[14px] bg-green-50 border border-green-200 px-3 py-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-[12px] font-bold text-green-700 leading-snug">
                  Password diubah — silakan login ulang
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2.5">
                {pwInput({ placeholder: 'Password Saat Ini', value: pwCurrent, onChange: setPwCurrent, show: showCur, toggle: () => setShowCur(s => !s) })}
                {pwInput({ placeholder: 'Password Baru', value: pwNew, onChange: setPwNew, show: showNew, toggle: () => setShowNew(s => !s) })}
                {pwInput({ placeholder: 'Konfirmasi Password Baru', value: pwConfirm, onChange: setPwConfirm, show: showConf, toggle: () => setShowConf(s => !s) })}

                {pwError && <p className="text-[11px] font-bold text-red-500">{pwError}</p>}

                <button
                  onClick={submitPassword} disabled={saving}
                  className="mt-1 w-full bg-navy text-white rounded-[14px] py-3.5 text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Password
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};