import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, X, BookOpen, FileCheck, MapPin, AlertCircle, RefreshCw,
  LogIn, LogOut, Loader2, CheckCircle2, CalendarDays,
} from 'lucide-react';
import { BottomNav, TABS, type TabId } from './BottomNav';
import { TopoPattern, WAVE_TOP_FILL, WAVE_BOTTOM_FILL } from './Decor';
import { RekapView } from './Rekap';
import { LogbookView } from './Logbook';
import { IzinView } from './Izin';
import { ProfileView } from './Profile';
import { SelfieCamera } from './SelfieCamera';
import { useTodayAttendance } from '../hooks/useTodayAttendance';
import { dashboardService, type DashboardStats } from '../services/dashboard';
import { fmtTimeID } from '../utils/date';
import { distanceM } from '../utils/geo';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  onUserUpdate?: (u: any) => void;
}

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

const SWEEP_TOTAL = 1400;
const SWITCH_AT = 700;

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

const PageSweep: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="page-sweep fixed inset-0 z-40 pointer-events-none">
    <div className="absolute inset-0 bg-navy">
      <div className="absolute inset-0 overflow-hidden"><TopoPattern /></div>
    </div>
    <svg className="block absolute left-0 w-full h-[90px] top-[calc(100%-8px)]" viewBox="0 0 1440 190" preserveAspectRatio="none">
      <path d={WAVE_TOP_FILL} fill="var(--theme-navy)" />
    </svg>
    <svg className="block absolute left-0 w-full h-[90px] bottom-[calc(100%-8px)]" viewBox="0 0 1440 190" preserveAspectRatio="none">
      <path d={WAVE_BOTTOM_FILL} fill="var(--theme-navy)" />
    </svg>

    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="relative w-20 h-20">
        <span className="sweep-ring absolute inset-0 rounded-full border-2 border-white/30" />
        <span className="sweep-ring-2 absolute inset-0 rounded-full border-2 border-white/20" />
        <div className="sweep-icon relative w-20 h-20 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-lg shadow-black/25">
          <Icon className="w-9 h-9" />
        </div>
      </div>
      <p className="sweep-cap mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Menuju</p>
      <h2 className="sweep-name mt-1.5 text-3xl font-extrabold text-white tracking-tight">{label}</h2>
      <div className="sweep-div w-10 h-[3px] bg-white/40 rounded-full mt-4" />
    </div>
  </div>
);

/* ═══════════ helpers ═══════════ */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
};

const fmtDur = (ms: number) => {
  if (ms <= 0) return '0j 0m';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}j ${m}m`;
};

/* badge status — monokrom navy: outline → solid → tint */
const StatusBadge: React.FC<{ hasIn: boolean; hasOut: boolean }> = ({ hasIn, hasOut }) => {
  const s = !hasIn
    ? { cls: 'bg-white text-navy/50 border-navy/20', label: 'Belum Absen', node: <span className="w-1.5 h-1.5 rounded-full border border-navy/40" /> }
    : !hasOut
      ? { cls: 'bg-navy text-white border-navy', label: 'Berlangsung', node: <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> }
      : { cls: 'bg-navy/10 text-navy border-navy/15', label: 'Selesai', node: <CheckCircle2 className="w-3 h-3" /> };
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-extrabold ${s.cls}`}>
      {s.node}
      {s.label}
    </span>
  );
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout, onUserUpdate }) => {
  const [tab, setTab] = useState<TabId>('home');
  const [pending, setPending] = useState<TabId | null>(null);
  const [cover, setCover] = useState(false);

  const [hasUnread, setHasUnread] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [closing, setClosing] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const s = await dashboardService.getStats();
      setStats(s);
    } catch (err: any) {
      setStatsError(err?.message || 'Gagal memuat statistik.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'home') {
      loadStats();
    }
  }, [tab, loadStats]);

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
    if (t === tab || cover) return;
    setPending(t);
    setCover(true);
    window.setTimeout(() => setTab(t), SWITCH_AT);
    window.setTimeout(() => { setCover(false); setPending(null); }, SWEEP_TOTAL);
  };

  const pendingMeta = pending ? TABS.find(x => x.id === pending) : null;

  return (
    <div className="relative min-h-screen bg-white flex flex-col">
      <FluidSweep />

      <div className="flex-1 flex flex-col">
        {tab === 'home' ? (
          <>
            {/* ═══ HERO navy ═══ */}
            <div className="rise-in relative bg-navy px-5 pt-6 pb-16 shrink-0 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden"><TopoPattern /></div>
              <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="absolute top-28 -left-24 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white text-sm font-extrabold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-semibold capitalize">
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-white text-[13px] font-extrabold leading-tight mt-0.5">{user?.className || 'Siswa PKL'}</p>
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
                <p className="text-white/60 text-[12px] font-semibold">{greeting()},</p>
                <h1 className="text-white text-[26px] font-extrabold tracking-tight leading-tight mt-0.5">{firstName}</h1>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3" />
                    {stats ? `${stats.attendanceCount} hari hadir` : '– hari hadir'}
                  </span>
                  {user?.companyName && (
                    <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white/70 flex items-center gap-1.5 max-w-[46%]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{user.companyName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ WHITE SHEET ═══ */}
            <div className="relative -mt-8 flex-1 bg-white rounded-t-[32px] px-5 pt-6 pb-32 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
              <HomeView
                user={user}
                stats={stats}
                loading={statsLoading}
                error={statsError}
                onRetry={loadStats}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
            {tab === 'rekap' ? (
              <RekapView user={user} />
            ) : tab === 'logbook' ? (
              <LogbookView />
            ) : tab === 'izin' ? (
              <IzinView />
            ) : tab === 'profil' ? (
              <ProfileView user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />
            ) : (
              <PlaceholderView tab={tab} />
            )}
          </div>
        )}
      </div>

      {cover && pendingMeta && <PageSweep icon={pendingMeta.icon} label={pendingMeta.label} />}

      <BottomNav className="nav-in" active={pending ?? tab} onChange={handleTabChange} />

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

/* ══════════════════════════════════════════════════════
   HOME VIEW — tiket absensi + ringkasan (Rekap pindah ke tab sendiri)
   ══════════════════════════════════════════════════════ */
interface HomeViewProps {
  user: any;
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ user, stats, error, onRetry }) => {
  const attendance = useTodayAttendance();
  const { today, acting, error: attError, gps, checkIn, checkOut } = attendance;

  const [selfie, setSelfie] = useState<string | null>(null);

  const [now, setNow] = useState(() => Date.now());
  const hasIn = !!today?.checkInTime;
  const hasOut = !!today?.checkOutTime;
  useEffect(() => {
    if (!hasIn || hasOut) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [hasIn, hasOut]);

  const fence = user?.companyLocation || null;
  const hasFence = !!(fence && fence.lat != null && fence.lng != null);
  const dist = gps.status === 'ok' && hasFence ? distanceM({ lat: gps.lat, lng: gps.lng }, fence) : null;
  const inFence = !hasFence || (dist !== null && dist <= (fence?.radius ?? 500));
  const reqSelfie = !!selfie;
  const reqLokasi = gps.status === 'ok' && inFence;
  const allReq = reqSelfie && reqLokasi;
  const needsVerify = !hasIn || !hasOut;

  const gpsText =
    gps.status === 'loading' ? 'Mendeteksi lokasi GPS...' :
    gps.status === 'error' ? 'GPS bermasalah — cek izin lokasi' :
    hasFence ? (inFence ? 'Kamu di area tempat magang' : 'Kamu di luar radius magang') :
    'Lokasi GPS terdeteksi';

  const durText = hasIn && hasOut
    ? fmtDur(new Date(today!.checkOutTime).getTime() - new Date(today!.checkInTime).getTime())
    : hasIn
      ? fmtDur(now - new Date(today!.checkInTime).getTime())
      : '–';

  const doCheckIn = async () => {
    if (!allReq) return;
    const ok = await checkIn();
    if (ok) { setSelfie(null); onRetry(); }
  };
  const doCheckOut = async () => {
    if (!allReq) return;
    const ok = await checkOut();
    if (ok) { setSelfie(null); onRetry(); }
  };

  return (
    <>
      {error && (
        <div className="rise-in bg-white rounded-[20px] border border-red-200 shadow-sm p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-red-600 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={onRetry}
            className="shrink-0 px-3 py-1.5 rounded-full bg-navy text-white text-[10px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Coba Lagi
          </button>
        </div>
      )}

      {/* ═══ TIKET ABSENSI ═══ */}
      <div className="rise-in relative bg-white rounded-[24px] border border-mist/60 shadow-[0_16px_40px_rgba(10,25,60,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-navy/40 uppercase tracking-[0.14em]">Absensi Hari Ini</p>
              <p className="text-[13px] font-extrabold text-navy capitalize mt-0.5">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
            <StatusBadge hasIn={hasIn} hasOut={hasOut} />
          </div>

          {attError && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-[12px] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-semibold text-red-600 leading-relaxed">{attError}</p>
            </div>
          )}

          {needsVerify && (
            <div className="mt-4">
              <SelfieCamera selfie={selfie} onSelfie={setSelfie} compact />
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto_1fr] items-end mt-5">
            <div>
              <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-navy/40">Masuk</p>
              <p className={`text-[24px] font-extrabold tabular-nums leading-none mt-1.5 ${hasIn ? 'text-navy' : 'text-navy/20'}`}>
                {hasIn ? fmtTimeID(today!.checkInTime) : '--:--'}
              </p>
            </div>

            <div className="flex flex-col items-center px-3 pb-0.5">
              <span className={`relative px-2 py-1 rounded-full border text-[8px] font-extrabold tabular-nums flex items-center gap-1 ${
                hasIn ? 'bg-navy/5 border-navy/15 text-navy' : 'bg-white border-mist/60 text-navy/30'
              }`}>
                {hasIn && !hasOut && <span className="w-1 h-1 rounded-full bg-navy animate-pulse" />}
                {durText}
              </span>
              <div className="w-12 border-t-2 border-dashed border-mist mt-2" />
            </div>

            <div className="text-right">
              <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-navy/40">Pulang</p>
              <p className={`text-[24px] font-extrabold tabular-nums leading-none mt-1.5 ${hasOut ? 'text-navy' : 'text-navy/20'}`}>
                {hasOut ? fmtTimeID(today!.checkOutTime) : '--:--'}
              </p>
            </div>
          </div>

          {!hasOut ? (
            <button
              onClick={hasIn ? doCheckOut : doCheckIn}
              disabled={!allReq || acting !== null || attendance.loading}
              className="mt-5 w-full bg-navy text-white rounded-[14px] py-3.5 flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
            >
              {acting !== null
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : hasIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span className="text-[12px] font-extrabold">
                {acting === 'in' ? 'Mengirim absen masuk...' :
                 acting === 'out' ? 'Mengirim absen pulang...' :
                 hasIn ? 'Absen Pulang' : 'Absen Masuk'}
              </span>
            </button>
          ) : (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-[14px] bg-navy/5 border border-navy/15 px-3 py-3.5">
              <CheckCircle2 className="w-4 h-4 text-navy shrink-0" />
              <p className="text-[11px] font-extrabold text-navy tabular-nums">Absensi lengkap · {durText}</p>
            </div>
          )}

          {needsVerify && (
            <div className="mt-4 pt-3.5 border-t border-dashed border-mist flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                reqLokasi ? 'bg-navy/10 text-navy' : 'bg-shell text-navy/40'
              }`}>
                {gps.status === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              </span>
              <p className={`flex-1 text-[10px] font-semibold truncate ${reqLokasi ? 'text-navy/70' : 'text-navy/40'}`}>
                {gpsText}
              </p>
              {dist !== null && hasFence && (
                <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold tabular-nums shrink-0 ${
                  inFence ? 'bg-navy/5 text-navy' : 'bg-red-50 text-red-500'
                }`}>
                  {dist} m
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ RINGKASAN — monokrom ═══ */}
      <div className="rise-in mt-4 bg-white rounded-[20px] border border-mist/60 shadow-sm grid grid-cols-3 divide-x divide-mist/60" style={{ animationDelay: '150ms' }}>
        <div className="py-4 flex flex-col items-center gap-1.5">
          <span className="w-7 h-7 rounded-full bg-navy/5 text-navy/60 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <p className="text-[17px] font-extrabold text-navy tabular-nums leading-none">{stats ? stats.totalLogbook : '–'}</p>
          <p className="text-[8px] font-extrabold text-navy/45 uppercase tracking-wide">Logbook</p>
        </div>
        <div className="py-4 flex flex-col items-center gap-1.5">
          <span className="w-7 h-7 rounded-full bg-navy/5 text-navy/60 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5" />
          </span>
          <p className="text-[17px] font-extrabold text-navy tabular-nums leading-none">{stats ? stats.revisiCount : '–'}</p>
          <p className="text-[8px] font-extrabold text-navy/45 uppercase tracking-wide">Review</p>
        </div>
        <div className="py-4 flex flex-col items-center gap-1.5">
          <span className="w-7 h-7 rounded-full bg-navy/5 text-navy/60 flex items-center justify-center">
            <FileCheck className="w-3.5 h-3.5" />
          </span>
          <p className="text-[17px] font-extrabold text-navy tabular-nums leading-none">{stats ? stats.izinPendingCount : '–'}</p>
          <p className="text-[8px] font-extrabold text-navy/45 uppercase tracking-wide">Izin</p>
        </div>
      </div>
    </>
  );
};

const PlaceholderView: React.FC<{ tab: TabId }> = ({ tab }) => {
  const meta = TABS.find(t => t.id === tab)!;
  const Icon = meta.icon;
  return (
    <div className="rise-in bg-shell rounded-[20px] border border-mist/60 p-8 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-[18px] bg-navy text-white flex items-center justify-center shadow-md shadow-navy/25"><Icon className="w-7 h-7" /></div>
      <h2 className="text-lg font-extrabold text-navy mt-4">{meta.label}</h2>
      <p className="text-xs font-semibold text-navy/50 mt-1 leading-relaxed">Halaman ini segera dibangun.</p>
    </div>
  );
};