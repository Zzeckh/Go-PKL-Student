import React, { useState, useEffect } from 'react';
import {
  LogOut, MapPin, BookOpen, FileCheck, ChevronRight, Clock, CheckCircle2,
  TrendingUp, User,
} from 'lucide-react';
import { BottomNav, TABS, type TabId } from './BottomNav';
import { TopoPattern, WAVE_TOP_FILL, WAVE_BOTTOM_FILL } from './LoginScreen';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
}

/* ── Aksi cepat (lingkaran, ala referensi) ── */
const QUICK: { icon: React.ElementType; label: string; tab: TabId }[] = [
  { icon: MapPin,    label: 'Absen',   tab: 'absensi' },
  { icon: BookOpen,  label: 'Logbook', tab: 'logbook' },
  { icon: FileCheck, label: 'Izin',    tab: 'izin' },
  { icon: User,      label: 'Profil',  tab: 'profil' },
];

/* ══════════════════════════════════════════════════════
   FLUID SWEEP — replika fluid login yang menyapu ke bawah
   ══════════════════════════════════════════════════════ */
const FluidSweep: React.FC = () => {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1000);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div className="fluid-sweep fixed inset-x-0 top-0 z-50 pointer-events-none" style={{ height: '30vh' }}>
      <div className="absolute inset-0 bg-navy">
        <div className="absolute inset-0 overflow-hidden">
          <TopoPattern />
        </div>
      </div>

      <svg
        className="block absolute left-0 w-full h-[90px] top-[calc(100%-8px)]"
        viewBox="0 0 1440 190"
        preserveAspectRatio="none"
      >
        <path d={WAVE_TOP_FILL} fill="var(--theme-navy)" />
      </svg>

      <svg
        className="block absolute left-0 w-full h-[90px] bottom-[calc(100%-8px)]"
        viewBox="0 0 1440 190"
        preserveAspectRatio="none"
      >
        <path d={WAVE_BOTTOM_FILL} fill="var(--theme-navy)" />
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   DASHBOARD SISWA — layout ala referensi fintech:
   hero navy → quick actions overlap → banner → aktivitas
   → kartu horizontal
   ══════════════════════════════════════════════════════ */
export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<TabId>('home');
  const fullName = user?.name || 'Siswa';
  const firstName = fullName.split(' ')[0];
  const initials = fullName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-shell">
      {/* fluid login menyapu ke bawah lalu hilang */}
      <FluidSweep />

      {/* ═══ HERO NAVY: greeting + angka besar (rounded bawah) ═══ */}
      <div className="rise-in relative overflow-hidden bg-navy rounded-b-[32px] px-5 pt-6 pb-16">
        <TopoPattern />

        {/* header row: avatar + nama | logout */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white text-sm font-extrabold">
              {initials}
            </div>
            <div>
              <p className="text-white/60 text-[11px] font-semibold">Halo,</p>
              <p className="text-white text-sm font-extrabold leading-tight">{firstName}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            aria-label="Keluar"
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white/70 flex items-center justify-center active:scale-90 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* angka besar ala "Total Balance" */}
        <div className="relative mt-6">
          <p className="text-white/60 text-[11px] font-semibold">Total Jam Magang</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-white text-4xl font-extrabold tabular-nums tracking-tight">142,5</p>
            <span className="text-white/60 text-sm font-bold mb-1">jam</span>
            <span className="mb-1 ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white/80">
              <TrendingUp className="w-3 h-3" /> +12% bulan ini
            </span>
          </div>
        </div>
      </div>

      {/* ═══ KONTEN ═══ */}
      <main className="px-5 pb-32">
        {/* kartu aksi cepat — overlap ke hero */}
        <div
          className="rise-in -mt-10 relative bg-white rounded-[24px] border border-mist/60 shadow-sm p-4"
          style={{ animationDelay: '150ms' }}
        >
          <div className="grid grid-cols-4 gap-2">
            {QUICK.map(q => (
              <button
                key={q.label}
                onClick={() => setTab(q.tab)}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all"
              >
                <span className="w-12 h-12 rounded-full bg-shell border border-mist/60 text-navy flex items-center justify-center">
                  <q.icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold text-navy/60">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {tab === 'home' ? (
          <HomeView name={firstName} />
        ) : (
          <PlaceholderView tab={tab} />
        )}
      </main>

      {/* ── Bottom nav slide-up ── */}
      <BottomNav className="nav-in" active={tab} onChange={setTab} />
    </div>
  );
};

/* ── HOME: banner progres + aktivitas + kartu horizontal ── */
const HomeView: React.FC<{ name: string }> = ({ name }) => (
  <>
    {/* banner progres (ala banner gradient referensi) */}
    <div
      className="rise-in relative overflow-hidden bg-navy rounded-[24px] p-5 mt-4 shadow-md shadow-navy/20"
      style={{ animationDelay: '250ms' }}
    >
      <TopoPattern />
      <div className="relative">
        <p className="text-white/60 text-[11px] font-semibold">Progres Magang · {name}</p>
        <h2 className="text-white text-xl font-extrabold mt-1 leading-snug tracking-tight">
          24 / 120 Hari
          <br />
          Terselesaikan
        </h2>
        <button className="mt-4 bg-white text-navy rounded-full px-5 py-2.5 text-[11px] font-extrabold shadow-md active:scale-95 transition-all">
          Lihat Progres
        </button>
        {/* dot pagination (dekoratif, ala referensi) */}
        <div className="flex items-center gap-1.5 mt-4">
          <span className="w-4 h-1.5 rounded-full bg-white" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
        </div>
      </div>
    </div>

    {/* aktivitas terbaru */}
    <section className="rise-in mt-6" style={{ animationDelay: '350ms' }}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-extrabold text-navy">Aktivitas Terbaru</h2>
        <button className="text-[11px] font-bold text-steel flex items-center gap-0.5">
          Lihat semua <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="mt-3 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 flex flex-col gap-4">
        <ActivityItem
          icon={CheckCircle2}
          title="Logbook disetujui"
          sub="Membuat fitur laporan harian · 2 jam lalu"
        />
        <ActivityItem
          icon={Clock}
          title="Absen masuk tercatat"
          sub="07:58 · Lokasi PT Maju Digital · Kemarin"
        />
        <ActivityItem
          icon={FileCheck}
          title="Pengajuan izin disetujui"
          sub="Sakit · Senin, minggu lalu"
        />
      </div>
    </section>

    {/* kartu horizontal scroll (ala marketplace referensi) */}
    <section className="rise-in mt-6" style={{ animationDelay: '450ms' }}>
      <h2 className="text-sm font-extrabold text-navy px-1">Ringkasan Minggu Ini</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
        <SummaryCard icon={BookOpen}  title="Logbook"  value="42 entri" sub="3 menunggu review" />
        <SummaryCard icon={MapPin}    title="Absensi"  value="18 hari"  sub="tepat waktu" />
        <SummaryCard icon={FileCheck} title="Perizinan" value="1 izin"  sub="disetujui" />
      </div>
    </section>
  </>
);

/* ── Kartu ringkasan horizontal ── */
const SummaryCard: React.FC<{ icon: React.ElementType; title: string; value: string; sub: string }> = ({
  icon: Icon, title, value, sub,
}) => (
  <div className="shrink-0 w-[160px] bg-white rounded-[20px] border border-mist/60 shadow-sm p-4">
    <div className="w-9 h-9 rounded-[12px] bg-navy text-white flex items-center justify-center">
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-3">{title}</p>
    <p className="text-lg font-extrabold text-navy tabular-nums mt-0.5">{value}</p>
    <p className="text-[10px] font-semibold text-navy/50 mt-0.5">{sub}</p>
  </div>
);

const ActivityItem: React.FC<{ icon: React.ElementType; title: string; sub: string }> = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-[12px] bg-navy text-white flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-navy truncate">{title}</p>
      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">{sub}</p>
    </div>
  </div>
);

/* ── Placeholder tab lain ── */
const PlaceholderView: React.FC<{ tab: TabId }> = ({ tab }) => {
  const meta = TABS.find(t => t.id === tab)!;
  const Icon = meta.icon;

  return (
    <div className="rise-in bg-white rounded-[24px] border border-mist/60 shadow-sm p-8 mt-4 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-[18px] bg-navy text-white flex items-center justify-center shadow-md shadow-navy/25">
        <Icon className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-extrabold text-navy mt-4">{meta.label}</h2>
      <p className="text-xs font-semibold text-navy/50 mt-1 leading-relaxed">
        Halaman ini segera dibangun. Fokus saat ini: dashboard & bottom navigation.
      </p>
    </div>
  );
};