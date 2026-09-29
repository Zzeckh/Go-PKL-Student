import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Building2, BookOpen, CheckCircle2,
  Mail, Phone, Lock, IdCard, LogOut, CalendarDays,
  Pencil, Check, X, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { dashboardService, type DashboardStats } from '../services/dashboard';
import { profileService } from '../services/profile';

interface ProfileViewProps {
  user: any;
  onLogout: () => void;
  onUserUpdate?: (u: any) => void;
}

type EditingRow = 'email' | 'wa' | 'pw' | null;

const fmtHours = (h: number) => String(h).replace('.', ',');

/* tampilkan nomor WA kanonik backend (tanpa leading 0) sebagai 08... */
const fmtWa = (v: string | null | undefined): string => {
  if (!v) return 'Belum diisi';
  return v.startsWith('0') ? v : `0${v}`;
};

/* tile statistik navy (sama gaya dengan Logbook) */
const StatTile: React.FC<{
  icon: React.ElementType;
  value: string | number;
  label: string;
  sub?: string;
}> = ({ icon: Icon, value, label, sub }) => (
  <div className="rounded-[16px] bg-navy p-4 shadow-md shadow-navy/20">
    <div className="flex items-center justify-between">
      <span className="w-9 h-9 rounded-[10px] bg-white/15 text-white flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
      <div className="text-right">
        <p className="text-2xl font-extrabold text-white tabular-nums leading-none">{value}</p>
        {sub && <p className="text-[9px] font-bold text-white/50 mt-1 tabular-nums">{sub}</p>}
      </div>
    </div>
    <p className="text-[9px] font-bold text-white/60 uppercase tracking-wide mt-3">{label}</p>
  </div>
);

/* row detail siswa statis (icon + label + value) */
const DetailRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <div className="w-9 h-9 rounded-[12px] bg-navy/10 text-navy flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className="text-[11px] font-bold text-navy leading-tight mt-0.5 truncate">{value}</p>
    </div>
  </div>
);

/* header section kecil */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-6">{children}</p>
);

/* trigger pensil "Ubah" */
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
   PROFILE VIEW — hero + stats + kontak & akun + keamanan
   + data siswa + tempat magang.
   Email/WhatsApp editable via PUT /api/auth/profile,
   password via PUT /api/auth/password (self-service).
   ══════════════════════════════════════════════════════ */
export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, onUserUpdate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  /* mirror user agar UI langsung segar setelah save —
     adjust state during render (dianjurkan React, tanpa effect) */
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

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /* ── state baris yang sedang diedit + form ── */
  const [editing, setEditing] = useState<EditingRow>(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<EditingRow>(null);

  const [emailDraft, setEmailDraft] = useState('');
  const [waDraft, setWaDraft] = useState('');

  /* ── state ganti password ── */
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const startEdit = (row: Exclude<EditingRow, 'pw'>) => {
    setRowError(null);
    setSavedFlash(null);
    if (row === 'email') setEmailDraft(profile?.email || '');
    if (row === 'wa') setWaDraft(profile?.whatsapp ? fmtWa(profile.whatsapp) : '');
    setEditing(row);
  };

  const cancelEdit = () => {
    setEditing(null);
    setRowError(null);
  };

  const flashSaved = (row: Exclude<EditingRow, 'pw'>) => {
    setSavedFlash(row);
    window.setTimeout(() => setSavedFlash((cur) => (cur === row ? null : cur)), 2000);
  };

  const commitUser = (u: any) => {
    setProfile(u);
    onUserUpdate?.(u);
  };

  /* refetch /auth/me lalu update context */
  const refreshMe = async () => {
    try {
      const me = await profileService.getMe();
      commitUser(me);
      return me;
    } catch {
      return null;
    }
  };

  /* ── simpan email / whatsapp ── */
  const saveProfile = async (row: 'email' | 'wa') => {
    setRowError(null);
    if (row === 'email') {
      const v = emailDraft.trim();
      if (!v) return setRowError('Email tidak boleh kosong');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setRowError('Format email tidak valid');
    } else {
      const v = waDraft.trim();
      if (!/^\+?[0-9]{9,15}$/.test(v)) {
        return setRowError('Nomor WhatsApp tidak valid (9–15 digit)');
      }
    }

    setSaving(true);
    try {
      const payload = row === 'email'
        ? { email: emailDraft.trim() }
        : { whatsapp: waDraft.trim() };
      const updated = await profileService.updateProfile(payload);
      commitUser(updated);
      await refreshMe();
      setEditing(null);
      flashSaved(row);
    } catch (err: any) {
      setRowError(err?.message || 'Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  /* ── ganti password ── */
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
    } finally {
      setSaving(false);
    }
  };

  const openPassword = () => {
    setPwError(null);
    setPwSuccess(false);
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setShowCur(false); setShowNew(false); setShowConf(false);
    setPwOpen(true);
  };

  const fullName = profile?.name || 'Siswa PKL';
  const initials = fullName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const kelas = profile?.className || '—';
  const major = profile?.major || '—';
  const email = profile?.email || '—';
  const company: string = profile?.companyName || 'Belum ditentukan';
  const companyAddress: string = profile?.companyAddress || 'Alamat belum diatur';
  const teacherName: string = profile?.teacherName || '—';

  const guruInitials = teacherName !== '—'
    ? teacherName
        .replace(/,.*$/, '')
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '—';

  const pwInput = (props: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    toggle: () => void;
  }) => (
    <div className="relative">
      <input
        type={props.show ? 'text' : 'password'}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={saving || pwSuccess}
        className="w-full rounded-[12px] border border-mist bg-shell/50 px-3 py-2.5 pr-10 text-[12px] font-semibold text-navy placeholder:text-navy/30 focus:border-navy outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={props.toggle}
        aria-label={props.show ? 'Sembunyikan' : 'Tampilkan'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy/40 active:scale-90 transition-transform"
      >
        {props.show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  return (
    <div className="relative -mx-5 -mt-6">
      {/* ═══ HERO PROFIL — navy full-bleed ═══ */}
      <div className="rise-in relative bg-navy px-5 pt-8 pb-20">
        <div className="relative flex flex-col items-center text-center">
          {/* avatar besar dengan status online */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/15 border-4 border-white/25 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-black/20">
              {initials}
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-400 border-[3px] border-navy" />
          </div>

          {/* nama + chips */}
          <h1 className="text-white text-2xl font-extrabold tracking-tight mt-4">{fullName}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
            <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5">
              <GraduationCap className="w-3 h-3" />
              {kelas}
            </span>
            {profile?.academicYear && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white/70 flex items-center gap-1.5">
                <IdCard className="w-3 h-3" />
                T.A. {profile.academicYear}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ WHITE SHEET overlap ═══ */}
      <div className="relative bg-white rounded-t-[32px] px-5 pt-6 pb-32 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">

        {/* 1) SECTION STATISTIK */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Statistik Magang</p>
          {statsError && (
            <button onClick={loadStats} className="text-[9px] font-bold text-red-500 underline">
              Muat ulang
            </button>
          )}
        </div>
        <div className="rise-in grid grid-cols-2 gap-3 mt-3" style={{ animationDelay: '100ms' }}>
          <StatTile
            icon={BookOpen}
            value={stats ? stats.totalLogbook : '–'}
            label="Logbook"
            sub={stats ? `${fmtHours(stats.totalHours)} jam` : undefined}
          />
          <StatTile
            icon={CheckCircle2}
            value={stats ? stats.attendanceCount : '–'}
            label="Kehadiran"
            sub="hari hadir"
          />
        </div>

        {/* 2) SECTION KONTAK & AKUN */}
        <SectionTitle>Kontak &amp; Akun</SectionTitle>
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm mt-3 divide-y divide-mist/60" style={{ animationDelay: '200ms' }}>

          {/* ── Row Email ── */}
          <div className="px-4 py-3.5">
            {editing === 'email' ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="email@contoh.com"
                    disabled={saving}
                    autoFocus
                    className="flex-1 min-w-0 rounded-[12px] border border-mist bg-shell/50 px-3 py-2.5 text-[12px] font-semibold text-navy placeholder:text-navy/30 focus:border-navy outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={() => saveProfile('email')}
                    disabled={saving}
                    aria-label="Simpan"
                    className="shrink-0 w-8 h-8 rounded-[10px] bg-navy text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    aria-label="Batal"
                    className="shrink-0 w-8 h-8 rounded-[10px] border border-mist text-navy/60 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {rowError && <p className="text-[10px] font-bold text-red-500">{rowError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[12px] bg-navy/10 text-navy flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Email</p>
                  <p className="text-[11px] font-bold text-navy leading-tight mt-0.5 truncate">{email}</p>
                  {savedFlash === 'email' && (
                    <p className="text-[10px] font-bold text-green-600 mt-0.5">Tersimpan</p>
                  )}
                </div>
                <EditTrigger onClick={() => startEdit('email')} disabled={saving || pwSuccess} />
              </div>
            )}
          </div>

          {/* ── Row WhatsApp ── */}
          <div className="px-4 py-3.5">
            {editing === 'wa' ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={waDraft}
                    onChange={(e) => setWaDraft(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    disabled={saving}
                    autoFocus
                    className="flex-1 min-w-0 rounded-[12px] border border-mist bg-shell/50 px-3 py-2.5 text-[12px] font-semibold text-navy placeholder:text-navy/30 focus:border-navy outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={() => saveProfile('wa')}
                    disabled={saving}
                    aria-label="Simpan"
                    className="shrink-0 w-8 h-8 rounded-[10px] bg-navy text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    aria-label="Batal"
                    className="shrink-0 w-8 h-8 rounded-[10px] border border-mist text-navy/60 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {rowError && <p className="text-[10px] font-bold text-red-500">{rowError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[12px] bg-navy/10 text-navy flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">WhatsApp</p>
                  <p className={`text-[11px] font-bold leading-tight mt-0.5 truncate ${profile?.whatsapp ? 'text-navy' : 'text-navy/40'}`}>
                    {fmtWa(profile?.whatsapp)}
                  </p>
                  {savedFlash === 'wa' && (
                    <p className="text-[10px] font-bold text-green-600 mt-0.5">Tersimpan</p>
                  )}
                </div>
                <EditTrigger onClick={() => startEdit('wa')} disabled={saving || pwSuccess} />
              </div>
            )}
          </div>
        </div>

        {/* 3) SECTION KEAMANAN */}
        <SectionTitle>Keamanan</SectionTitle>
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm mt-3 divide-y divide-mist/60" style={{ animationDelay: '300ms' }}>

          {/* ── Row Password (collapsed) ── */}
          {!pwOpen && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-[12px] bg-navy/10 text-navy flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Password</p>
                <p className="text-[11px] font-bold text-navy leading-tight mt-0.5 tracking-widest">••••••••</p>
              </div>
              <EditTrigger onClick={openPassword} disabled={saving} />
            </div>
          )}

          {/* ── Form ganti password (expanded) ── */}
          {pwOpen && (
            <div className="px-4 py-4 flex flex-col gap-2.5">
              {pwSuccess ? (
                <div className="rounded-[12px] bg-green-50 border border-green-200 px-3 py-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-[11px] font-bold text-green-700 leading-snug">
                    Password diubah — silakan login ulang
                  </p>
                </div>
              ) : (
                <>
                  {pwInput({ placeholder: 'Password Saat Ini', value: pwCurrent, onChange: setPwCurrent, show: showCur, toggle: () => setShowCur(s => !s) })}
                  {pwInput({ placeholder: 'Password Baru', value: pwNew, onChange: setPwNew, show: showNew, toggle: () => setShowNew(s => !s) })}
                  {pwInput({ placeholder: 'Konfirmasi Password Baru', value: pwConfirm, onChange: setPwConfirm, show: showConf, toggle: () => setShowConf(s => !s) })}

                  {pwError && <p className="text-[10px] font-bold text-red-500">{pwError}</p>}

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={submitPassword}
                      disabled={saving}
                      className="bg-navy text-white rounded-full px-4 py-2 text-[11px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                      Simpan Password
                    </button>
                    <button
                      onClick={() => { setPwOpen(false); setPwError(null); }}
                      disabled={saving}
                      className="border border-mist text-navy/60 rounded-full px-4 py-2 text-[11px] font-extrabold active:scale-95 transition-all disabled:opacity-50"
                    >
                      Batal
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 4) SECTION TEMPAT MAGANG */}
        <SectionTitle>Tempat Magang</SectionTitle>
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-3" style={{ animationDelay: '400ms' }}>
          {/* perusahaan */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[12px] bg-navy text-white flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-navy leading-tight">{company}</p>
              <p className="text-[10px] font-semibold text-navy/50 truncate mt-0.5">{companyAddress}</p>
            </div>
          </div>

          {/* guru pembimbing */}
          <div className="mt-4 pt-4 border-t border-mist/60 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-shell border border-mist/60 flex items-center justify-center text-navy text-[10px] font-extrabold shrink-0">
              {guruInitials}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Guru Pembimbing</p>
              <p className="text-[10px] font-bold text-navy truncate leading-tight mt-0.5">
                {teacherName}
              </p>
              {profile?.major && (
                <p className="text-[9px] font-semibold text-navy/50 truncate">{profile.major}</p>
              )}
            </div>
          </div>
        </div>

        {/* 5) SECTION DATA SISWA (Email pindah ke Kontak & Akun) */}
        <SectionTitle>Data Siswa</SectionTitle>
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm mt-3 divide-y divide-mist/60" style={{ animationDelay: '500ms' }}>
          <DetailRow icon={GraduationCap} label="Jurusan" value={major} />
          {profile?.academicYear && (
            <DetailRow icon={CalendarDays} label="Tahun Ajaran" value={String(profile.academicYear)} />
          )}
        </div>

        {/* 6) TOMBOL LOGOUT */}
        <button
          onClick={onLogout}
          className="rise-in mt-6 w-full bg-navy text-white rounded-full py-4 text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all"
          style={{ animationDelay: '600ms' }}
        >
          <LogOut className="w-4 h-4" /> Keluar dari Akun
        </button>

        <p className="rise-in mt-3 text-center text-[10px] font-semibold text-navy/40" style={{ animationDelay: '650ms' }}>
          Go-PKL v1.0 · © 2026
        </p>
      </div>
    </div>
  );
};
