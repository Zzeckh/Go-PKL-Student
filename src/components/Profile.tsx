import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Building2, BookOpen, CheckCircle2,
  Mail, IdCard, LogOut, CalendarDays,
} from 'lucide-react';
import { dashboardService, type DashboardStats } from '../services/dashboard';

interface ProfileViewProps {
  user: any;
  onLogout: () => void;
}

const fmtHours = (h: number) => String(h).replace('.', ',');

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

/* row detail siswa (icon + label + value) */
const DetailRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  last?: boolean;
}> = ({ icon: Icon, label, value, last }) => (
  <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? '' : ''}`}>
    <div className="w-9 h-9 rounded-[12px] bg-navy/10 text-navy flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className="text-[11px] font-bold text-navy leading-tight mt-0.5 truncate">{value}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   PROFILE VIEW — hero avatar + stats + info PKL + detail
   Semua data dari objek user (login / /api/auth/me) +
   statistik dari data logbook & absensi.
   ══════════════════════════════════════════════════════ */
export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

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

  const fullName = user?.name || 'Siswa PKL';
  const initials = fullName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const kelas = user?.className || '—';
  const major = user?.major || '—';
  const email = user?.email || '—';
  const company: string = user?.companyName || 'Belum ditentukan';
  const companyAddress: string = user?.companyAddress || 'Alamat belum diatur';
  const teacherName: string = user?.teacherName || '—';

  const guruInitials = teacherName !== '—'
    ? teacherName
        .replace(/,.*$/, '')
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '—';

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
            {user?.academicYear && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white/70 flex items-center gap-1.5">
                <IdCard className="w-3 h-3" />
                T.A. {user.academicYear}
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

        {/* 2) SECTION INFO PKL */}
        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-6">Tempat Magang</p>
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-3" style={{ animationDelay: '200ms' }}>
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

          {/* guru pembimbing — data dari user (mentor belum tersedia di API) */}
          <div className="mt-4 pt-4 border-t border-mist/60 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-shell border border-mist/60 flex items-center justify-center text-navy text-[10px] font-extrabold shrink-0">
              {guruInitials}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Guru Pembimbing</p>
              <p className="text-[10px] font-bold text-navy truncate leading-tight mt-0.5">
                {teacherName}
              </p>
              {user?.major && (
                <p className="text-[9px] font-semibold text-navy/50 truncate">{user.major}</p>
              )}
            </div>
          </div>
        </div>

        {/* 3) SECTION DATA SISWA */}
        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-6">Data Siswa</p>
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm mt-3 divide-y divide-mist/60" style={{ animationDelay: '300ms' }}>
          <DetailRow icon={GraduationCap} label="Jurusan" value={major} />
          <DetailRow icon={Mail} label="Email" value={email} />
          {user?.academicYear && (
            <DetailRow icon={CalendarDays} label="Tahun Ajaran" value={String(user.academicYear)} last />
          )}
        </div>

        {/* 4) TOMBOL LOGOUT */}
        <button
          onClick={onLogout}
          className="rise-in mt-6 w-full bg-navy text-white rounded-full py-4 text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all"
          style={{ animationDelay: '400ms' }}
        >
          <LogOut className="w-4 h-4" /> Keluar dari Akun
        </button>

        <p className="rise-in mt-3 text-center text-[10px] font-semibold text-navy/40" style={{ animationDelay: '450ms' }}>
          Go-PKL v1.0 · © 2026
        </p>
      </div>
    </div>
  );
};
