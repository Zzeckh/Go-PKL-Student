import React, { useState } from 'react';
import {
  LogOut, MapPin, FileCheck, ChevronRight, Clock, CheckCircle2,
} from 'lucide-react';
import { BottomNav, TABS } from './BottomNav';
import type { TabId } from './BottomNav';
import { Logo } from './Logo';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
}

/* ══════════════════════════════════════════════════════
   DASHBOARD SISWA — shell + home + bottom nav
   ══════════════════════════════════════════════════════ */
export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<TabId>('home');
  const firstName = (user?.name || 'Siswa').split(' ')[0];

  return (
    <div className="min-h-screen bg-shell">
      {/* ── Header ─ */}
      <header className="sticky top-0 z-20 bg-shell/80 backdrop-blur-md px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-navy flex items-center justify-center shadow-md shadow-navy/20">
            <Logo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-navy/50">Halo,</p>
            <p className="text-sm font-extrabold text-navy leading-tight">{firstName}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          aria-label="Keluar"
          className="w-10 h-10 rounded-full bg-white border border-mist/60 flex items-center justify-center text-navy/50 active:scale-90 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* ── Konten ── */}
      <main className="px-5 pb-32">
        {tab === 'home' ? <HomeView name={firstName} /> : <PlaceholderView tab={tab} />}
      </main>

      {/* ── Bottom nav ── */}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
};

/* ── HOME: hero kehadiran + stats + aktivitas ── */
const HomeView: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex flex-col gap-4">
    {/* hero navy */}
    <div className="relative overflow-hidden bg-navy rounded-[24px] p-5 shadow-md shadow-navy/20">
      <p className="text-white/60 text-[11px] font-semibold">Semangat magang hari ini!</p>
      <h1 className="text-white text-xl font-extrabold mt-1 tracking-tight">Halo, {name}</h1>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white/60 text-[11px] font-semibold">Status kehadiran</p>
          <p className="text-white text-sm font-bold mt-0.5 truncate">Belum absen hari ini</p>
        </div>
        <button className="shrink-0 bg-white text-navy rounded-full px-5 py-2.5 text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all">
          <MapPin className="w-3.5 h-3.5" /> Absen
        </button>
      </div>
    </div>

    {/* stats */}
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 text-center">
        <p className="text-2xl font-extrabold text-navy tabular-nums">18</p>
        <p className="text-[10px] font-bold text-navy/50 mt-1 uppercase tracking-wide">Hadir</p>
      </div>
      <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 text-center">
        <p className="text-2xl font-extrabold text-navy tabular-nums">42</p>
        <p className="text-[10px] font-bold text-navy/50 mt-1 uppercase tracking-wide">Logbook</p>
      </div>
      <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 text-center">
        <p className="text-2xl font-extrabold text-navy tabular-nums">1</p>
        <p className="text-[10px] font-bold text-navy/50 mt-1 uppercase tracking-wide">Izin</p>
      </div>
    </div>

    {/* aktivitas terbaru */}
    <section className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-navy">Aktivitas Terbaru</h2>
        <button className="text-[11px] font-bold text-steel flex items-center gap-0.5">
          Lihat semua <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
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

/* ── Placeholder tab lain (segera dibangun) ── */
const PlaceholderView: React.FC<{ tab: TabId }> = ({ tab }) => {
  const meta = TABS.find(t => t.id === tab)!;
  const Icon = meta.icon;

  return (
    <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-8 flex flex-col items-center text-center">
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