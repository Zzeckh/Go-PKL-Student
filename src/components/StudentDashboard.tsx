import React, { useState, useEffect } from 'react';
import {
  LogOut, Bell, X, BookOpen, FileCheck, MapPin, Building2, Clock,
} from 'lucide-react';
import { BottomNav, TABS, type TabId } from './BottomNav';
import { TopoPattern, WAVE_TOP_FILL, WAVE_BOTTOM_FILL } from './LoginScreen';
import { AbsensiView } from './Absensi';
import { LogbookView } from './Logbook';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
}

const LOGBOOK_WEEK = [
  { date: '10/02', count: 1 },
  { date: '11/02', count: 2 },
  { date: '12/02', count: 1 },
  { date: '13/02', count: 3 },
  { date: '14/02', count: 2 },
  { date: '15/02', count: 0 },
  { date: '16/02', count: 2, today: true },
];
const MAX_COUNT = Math.max(...LOGBOOK_WEEK.map(d => d.count));

type Notif = {
  id: number;
  type: 'logbook' | 'izin';
  tone: 'ok' | 'warn';
  title: string;
  sub: string;
  time: string;
};

const NOTIFS: Notif[] = [
  { id: 1, type: 'logbook', tone: 'ok',   title: 'Logbook disetujui', sub: 'Entri 16/02.',      time: '2 jam' },
  { id: 2, type: 'izin',    tone: 'ok',   title: 'Izin diterima',     sub: 'Sakit · 14/02.',    time: '1 hari' },
  { id: 3, type: 'logbook', tone: 'warn', title: 'Logbook revisi',    sub: 'Entri 13/02.',      time: '2 hari' },
  { id: 4, type: 'izin',    tone: 'ok',   title: 'Izin diterima',     sub: 'Keluarga · 10/02.', time: '4 hari' },
  { id: 5, type: 'logbook', tone: 'ok',   title: 'Logbook disetujui', sub: 'Entri 09/02.',      time: '1 mgg' },
];
const SHOWN_NOTIFS = NOTIFS.slice(0, 4);

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
        <div className="absolute inset-0 overflow-hidden"><TopoPattern /></div>
      </div>
      <svg className="block absolute left-0 w-full h-[90px] top-[calc(100%-8px)]" viewBox="0 0 1440 190" preserveAspectRatio="none">
        <path d={WAVE_TOP_FILL} fill="var(--theme-navy)" />
      </svg>
      <svg className="block absolute left-0 w-full h-[90px] bottom-[calc(100%-8px)]" viewBox="0 0 1440 190" preserveAspectRatio="none">
        <path d={WAVE_BOTTOM_FILL} fill="var(--theme-navy)" />
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   DASHBOARD SISWA
   absensi → transisi ATAS · logbook (dll) → transisi BAWAH
   ══════════════════════════════════════════════════════ */
export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<TabId>('home');
  const [hasUnread, setHasUnread] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [closing, setClosing] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [exitDir, setExitDir] = useState<'up' | 'down'>('up');

  const fullName = user?.name || 'Siswa';
  const firstName = fullName.split(' ')[0];
  const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const closeNotif = () => {
    setClosing(true);
    setTimeout(() => { setShowNotif(false); setClosing(false); }, 300);
  };

  const handleBell = () => {
    if (showNotif) closeNotif();
    else { setHasUnread(false); setShowNotif(true); }
  };

  const handleTabChange = (t: TabId) => {
    if (showNotif) closeNotif();
    if (t === tab || exiting) return;

    if (tab === 'home') {
      setExitDir(t === 'absensi' ? 'up' : 'down');
      setExiting(true);
      setTimeout(() => {
        setTab(t);
        setExiting(false);
      }, 600);
    } else {
      setTab(t);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col">
      <FluidSweep />

      {/* ═══ HOME (lapisan exit) ═══ */}
      {(tab === 'home' || exiting) && (
        <div className={`flex-1 flex flex-col ${exiting && exitDir === 'down' ? 'exit-down' : ''}`}>
          {/* hero navy */}
          <div className={`relative bg-navy px-5 pt-6 pb-16 shrink-0 ${exiting && exitDir === 'up' ? 'exit-up' : 'rise-in'}`}>
            <div className="absolute inset-0 overflow-hidden"><TopoPattern /></div>

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
                onClick={handleBell}
                aria-label="Notifikasi"
                className={`relative w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all ${
                  showNotif ? 'bg-white text-navy border-white' : 'bg-white/10 border-white/15 text-white/70'
                }`}
              >
                {showNotif ? <X className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {hasUnread && !showNotif && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-navy" />
                )}
              </button>
            </div>

            <div className="relative mt-6">
              <p className="text-white/60 text-[11px] font-semibold">Total Kehadiran</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-white text-4xl font-extrabold tabular-nums tracking-tight">18</p>
                <span className="text-white/60 text-sm font-bold mb-1">hari</span>
                <button
                  onClick={() => handleTabChange('absensi')}
                  className="mb-1 ml-auto shrink-0 bg-white text-navy rounded-full px-5 py-2.5 text-[11px] font-extrabold flex items-center gap-1.5 shadow-md shadow-black/20 active:scale-95 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5" /> Absen
                </button>
              </div>
            </div>
          </div>

          {/* sheet putih */}
          <div className={`relative -mt-8 flex-1 bg-white rounded-t-[32px] px-5 pt-6 pb-32 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] ${exiting && exitDir === 'up' ? 'sheet-become-bg' : ''}`}>
            <div className={exiting ? 'content-fade' : ''}>
              <HomeView name={firstName} />
            </div>
          </div>
        </div>
      )}

      {/* ═══ HALAMAN LAIN ═══ */}
      {!exiting && tab !== 'home' && (
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
          {tab === 'absensi' ? (
            <AbsensiView />
          ) : tab === 'logbook' ? (
            <LogbookView />
          ) : (
            <PlaceholderView tab={tab} onLogout={onLogout} />
          )}
        </div>
      )}

      <BottomNav className="nav-in" active={tab} onChange={handleTabChange} />

      {showNotif && <NotifPop closing={closing} />}
    </div>
  );
};

const NotifPop: React.FC<{ closing: boolean }> = ({ closing }) => (
  <div className={`${closing ? 'pop-out' : 'pop-in'} absolute right-5 top-[68px] z-40 w-60 bg-white rounded-[16px] border border-mist/60 shadow-lg shadow-navy/15 p-2.5`}>
    <div className="flex items-center justify-between px-1">
      <p className="text-[11px] font-extrabold text-navy">Notifikasi</p>
      <span className="px-1.5 py-0.5 rounded-full bg-shell border border-mist/60 text-[8px] font-bold text-navy/60">
        {SHOWN_NOTIFS.length} terbaru
      </span>
    </div>
    <div className="mt-1 flex flex-col">
      {SHOWN_NOTIFS.map((n, i) => (
        <div key={n.id} className={`flex items-center gap-2 px-1 py-2 ${i > 0 ? 'border-t border-mist/60' : ''}`}>
          <span className={`w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 ${
            n.tone === 'ok' ? 'bg-navy/10 text-navy' : 'bg-mist text-navy'
          }`}>
            {n.type === 'logbook' ? <BookOpen className="w-3 h-3" /> : <FileCheck className="w-3 h-3" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-navy truncate">{n.title}</p>
            <p className="text-[9px] font-semibold text-navy/50 truncate">{n.sub}</p>
          </div>
          <span className="text-[8px] font-bold text-navy/40 shrink-0">{n.time}</span>
        </div>
      ))}
    </div>
  </div>
);

const HomeView: React.FC<{ name: string }> = ({ name }) => (
  <>
    <div className="rise-in bg-navy rounded-[20px] p-4 shadow-md shadow-navy/20" style={{ animationDelay: '200ms' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white/60 text-[10px] font-semibold">Progres Logbook · {name}</p>
          <p className="text-white text-sm font-extrabold mt-0.5 tracking-tight">Minggu Ini</p>
        </div>
        <span className="shrink-0 px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[9px] font-bold text-white/80 tabular-nums">32 / 42</span>
      </div>
      <div className="flex items-end justify-between gap-1.5 mt-4">
        {LOGBOOK_WEEK.map((d, i) => {
          const height = d.count === 0 ? 3 : Math.round((d.count / MAX_COUNT) * 56);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center">
              <span className="text-[8px] font-bold text-white/60 tabular-nums h-3">{d.count > 0 ? d.count : ''}</span>
              <div className="w-full h-14 flex items-end justify-center mt-0.5">
                <div
                  className={`bar-grow w-2.5 rounded-full ${d.today ? 'bg-white shadow-md shadow-black/20' : 'bg-white/35'}`}
                  style={{ height: `${height}px`, animationDelay: `${300 + i * 60}ms` }}
                />
              </div>
              <div className="w-full border-t border-white/10 mt-1 pt-1">
                <p className={`text-center text-[8px] font-bold tabular-nums ${d.today ? 'text-white' : 'text-white/50'}`}>{d.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="rise-in grid grid-cols-3 gap-3 mt-4" style={{ animationDelay: '300ms' }}>
      <div className="bg-white rounded-[16px] border border-mist/60 shadow-sm p-3 text-center">
        <p className="text-lg font-extrabold text-navy tabular-nums">32</p>
        <p className="text-[9px] font-bold text-navy/50 mt-0.5 uppercase tracking-wide">Logbook</p>
      </div>
      <div className="bg-white rounded-[16px] border border-mist/60 shadow-sm p-3 text-center">
        <p className="text-lg font-extrabold text-navy tabular-nums">3</p>
        <p className="text-[9px] font-bold text-navy/50 mt-0.5 uppercase tracking-wide">Review</p>
      </div>
      <div className="bg-white rounded-[16px] border border-mist/60 shadow-sm p-3 text-center">
        <p className="text-lg font-extrabold text-navy tabular-nums">1</p>
        <p className="text-[9px] font-bold text-navy/50 mt-0.5 uppercase tracking-wide">Izin</p>
      </div>
    </div>

    <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-4" style={{ animationDelay: '400ms' }}>
      <p className="text-[11px] font-extrabold text-navy">Info Magang</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-navy text-white flex items-center justify-center shrink-0"><Building2 className="w-4 h-4" /></div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-navy truncate">PT Maju Digital</p>
          <p className="text-[10px] font-semibold text-navy/50 truncate">Mentor: Budi Santoso</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-navy/60">
        <Clock className="w-3 h-3" /> Senin–Jumat · 08:00–16:00
      </div>
    </div>
  </>
);

const PlaceholderView: React.FC<{ tab: TabId; onLogout: () => void }> = ({ tab, onLogout }) => {
  const meta = TABS.find(t => t.id === tab)!;
  const Icon = meta.icon;
  return (
    <>
      <div className="rise-in bg-shell rounded-[20px] border border-mist/60 p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-[18px] bg-navy text-white flex items-center justify-center shadow-md shadow-navy/25"><Icon className="w-7 h-7" /></div>
        <h2 className="text-lg font-extrabold text-navy mt-4">{meta.label}</h2>
        <p className="text-xs font-semibold text-navy/50 mt-1 leading-relaxed">Halaman ini segera dibangun.</p>
      </div>
      {tab === 'profil' && (
        <button
          onClick={onLogout}
          className="rise-in mt-4 w-full bg-navy text-white rounded-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all"
          style={{ animationDelay: '150ms' }}
        >
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      )}
    </>
  );
};