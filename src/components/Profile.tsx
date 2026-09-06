import React from 'react';
import {
  GraduationCap, Building2, BookOpen, CheckCircle2,
  Mail, Phone, IdCard, LogOut, CalendarDays,
} from 'lucide-react';

interface ProfileViewProps {
  user: any;
  onLogout: () => void;
}

/* data tempat magang (nanti dari API profil magang) */
const INTERNSHIP = {
  company: 'PT Maju Digital',
  address: 'Jl. Inovasi No. 12, Bandung',
  guruPembimbing: { name: 'Siti Aminah, S.Pd.', subject: 'Produktif RPL' },
  mentor: { name: 'Budi Santoso, S.Kom.', role: 'Senior Developer' },
};

/* statistik (nanti dari API) */
const STATS = {
  logbookCount: 32,
  logbookHours: 256.5,
  kehadiran: 18,
  kehadiranPersen: 96,
};

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
   ══════════════════════════════════════════════════════ */
export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout }) => {
  const fullName = user?.name || 'Siswa PKL';
  const initials = fullName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const kelas = user?.class || 'XII RPL 2';
  const nis = user?.nis || '2022101001';
  const major = user?.major || 'Rekayasa Perangkat Lunak';
  const email = user?.email || 'siswa@sch.id';
  const phone = user?.phone || '0812-3456-7890';

  const guruInitials = INTERNSHIP.guruPembimbing.name
    .replace(/,.*$/, '')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const mentorInitials = INTERNSHIP.mentor.name
    .replace(/,.*$/, '')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white/70 flex items-center gap-1.5">
              <IdCard className="w-3 h-3" />
              {nis}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ WHITE SHEET overlap ═══ */}
      <div className="relative bg-white rounded-t-[32px] px-5 pt-6 pb-32 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">

        {/* 1) SECTION STATISTIK */}
        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Statistik Magang</p>
        <div className="rise-in grid grid-cols-2 gap-3 mt-3" style={{ animationDelay: '100ms' }}>
          <StatTile
            icon={BookOpen}
            value={STATS.logbookCount}
            label="Logbook"
            sub={`${fmtHours(STATS.logbookHours)} jam`}
          />
          <StatTile
            icon={CheckCircle2}
            value={STATS.kehadiran}
            label="Kehadiran"
            sub={`${STATS.kehadiranPersen}% tepat waktu`}
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
              <p className="text-sm font-extrabold text-navy leading-tight">{INTERNSHIP.company}</p>
              <p className="text-[10px] font-semibold text-navy/50 truncate mt-0.5">{INTERNSHIP.address}</p>
            </div>
          </div>

          {/* guru + mentor — 2 kolom */}
          <div className="mt-4 pt-4 border-t border-mist/60 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-shell border border-mist/60 flex items-center justify-center text-navy text-[10px] font-extrabold shrink-0">
                {guruInitials}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Guru Pembimbing</p>
                <p className="text-[10px] font-bold text-navy truncate leading-tight mt-0.5">
                  {INTERNSHIP.guruPembimbing.name}
                </p>
                <p className="text-[9px] font-semibold text-navy/50 truncate">{INTERNSHIP.guruPembimbing.subject}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-navy/10 text-navy flex items-center justify-center text-[10px] font-extrabold shrink-0">
                {mentorInitials}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Mentor</p>
                <p className="text-[10px] font-bold text-navy truncate leading-tight mt-0.5">
                  {INTERNSHIP.mentor.name}
                </p>
                <p className="text-[9px] font-semibold text-navy/50 truncate">{INTERNSHIP.mentor.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3) SECTION DATA SISWA */}
        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-6">Data Siswa</p>
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm mt-3 divide-y divide-mist/60" style={{ animationDelay: '300ms' }}>
          <DetailRow icon={GraduationCap} label="Jurusan" value={major} />
          <DetailRow icon={Mail} label="Email" value={email} />
          <DetailRow icon={Phone} label="No. HP" value={phone} />
          <DetailRow icon={CalendarDays} label="Periode Magang" value="06 Jan – 26 Jun 2026" last />
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