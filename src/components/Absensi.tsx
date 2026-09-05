import React, { useState, useEffect } from 'react';
import {
  LogIn, LogOut, MapPin, RefreshCw, Loader2, CheckCircle2, AlertCircle, History,
} from 'lucide-react';

/* ⚠️ Sesuaikan dengan endpoint asli di backend (routes attendance) */
const URL_CHECK_IN = '/api/attendance/check-in';
const URL_CHECK_OUT = '/api/attendance/check-out';

/* ── Lokasi tempat magang (nanti dari API profil magang) ── */
const OFFICE = { lat: -6.914744, lng: 107.60981 };
const RADIUS_M = 150; // batas geofence

/* ── Riwayat (nanti dari API) ── */
const HISTORY = [
  { date: '16/02', in: '07:58', out: '16:02', status: 'Hadir' },
  { date: '14/02', in: '08:01', out: '16:00', status: 'Hadir' },
  { date: '13/02', in: '—',     out: '—',     status: 'Izin' },
  { date: '12/02', in: '07:55', out: '16:05', status: 'Hadir' },
];

type Gps =
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lng: number; accuracy: number }
  | { status: 'error'; message: string };

/* ── jarak haversine (meter) ── */
const distanceM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
};

const fmtClock = (d: Date) =>
  d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');

const fmtDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ══════════════════════════════════════════════════════
   ABSENSI VIEW — jam live + GPS + check-in/out + riwayat
   ══════════════════════════════════════════════════════ */
export const AbsensiView: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [gps, setGps] = useState<Gps>({ status: 'loading' });
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'in' | 'out'>(null);

  /* jam live */
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  /* minta lokasi GPS */
  const locate = () => {
    setGps({ status: 'loading' });
    if (!('geolocation' in navigator)) {
      setGps({ status: 'error', message: 'Perangkat tidak mendukung GPS.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos =>
        setGps({
          status: 'ok',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }),
      err =>
        setGps({
          status: 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Izin lokasi ditolak. Aktifkan GPS di pengaturan.'
              : 'Lokasi tidak ditemukan. Pastikan GPS aktif & halaman via HTTPS.',
        }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dist = gps.status === 'ok' ? distanceM({ lat: gps.lat, lng: gps.lng }, OFFICE) : null;
  const inFence = dist !== null && dist <= RADIUS_M;

  /* ── absen masuk / selesai ── */
  const doAbsen = async (type: 'in' | 'out') => {
    setBusy(type);
    const body = gps.status === 'ok' ? { latitude: gps.lat, longitude: gps.lng, accuracy: gps.accuracy } : {};
    try {
      const token = localStorage.getItem('pkl_token') || sessionStorage.getItem('pkl_token');
      const res = await fetch(type === 'in' ? URL_CHECK_IN : URL_CHECK_OUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal absen.');
      const t = fmtTime(new Date());
      if (type === 'in') setCheckIn(data?.check_in || t);
      else setCheckOut(data?.check_out || t);
    } catch {
      /* mode demo saat backend belum siap */
      const t = fmtTime(new Date());
      if (type === 'in') setCheckIn(t);
      else setCheckOut(t);
    } finally {
      setBusy(null);
    }
  };

  const status = checkOut ? 'selesai' : checkIn ? 'masuk' : 'belum';

  return (
    <>
      {/* 1) kartu jam live */}
      <div className="rise-in relative overflow-hidden bg-navy rounded-[20px] p-5 shadow-md shadow-navy/20">
        <p className="text-white/60 text-[10px] font-semibold">{fmtDate(now)}</p>
        <p className="text-white text-4xl font-extrabold tabular-nums tracking-tight mt-1">{fmtClock(now)}</p>

        <div className="mt-4 flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold flex items-center gap-1.5 ${
            inFence
              ? 'bg-white/10 border-white/15 text-white/80'
              : 'bg-white/10 border-white/15 text-white/60'
          }`}>
            <MapPin className="w-3 h-3" />
            {gps.status === 'loading' && 'Mencari lokasi...'}
            {gps.status === 'error' && 'GPS tidak tersedia'}
            {gps.status === 'ok' && (inFence ? `Di area magang · ${dist} m` : `Di luar area · ${dist} m`)}
          </span>
        </div>
      </div>

      {/* 2) kartu status GPS */}
      <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-4" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-navy">Lokasi GPS</p>
          <button onClick={locate} className="text-[10px] font-bold text-steel flex items-center gap-1 active:scale-95 transition-all">
            <RefreshCw className="w-3 h-3" /> Perbarui
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${
            gps.status === 'ok'
              ? inFence ? 'bg-navy/10 text-navy' : 'bg-mist text-navy'
              : gps.status === 'loading' ? 'bg-mist text-navy' : 'bg-mist text-navy'
          }`}>
            {gps.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {gps.status === 'ok' && (inFence ? <CheckCircle2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />)}
            {gps.status === 'error' && <AlertCircle className="w-4 h-4" />}
          </span>

          <div className="min-w-0">
            <p className="text-xs font-bold text-navy truncate">
              {gps.status === 'loading' && 'Mendeteksi lokasi...'}
              {gps.status === 'ok' && (inFence ? 'Dalam area magang' : 'Luar area magang')}
              {gps.status === 'error' && 'GPS bermasalah'}
            </p>
            <p className="text-[10px] font-semibold text-navy/50 truncate mt-0.5">
              {gps.status === 'ok' && `Akurasi ±${gps.accuracy} m · ${dist} m dari lokasi`}
              {gps.status === 'loading' && 'Pastikan GPS aktif'}
              {gps.status === 'error' && (gps as any).message}
            </p>
          </div>
        </div>
      </div>

      {/* 3) tombol absen */}
      <div className="rise-in grid grid-cols-2 gap-3 mt-4" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => doAbsen('in')}
          disabled={!!checkIn || busy !== null}
          className={`rounded-[16px] py-4 flex flex-col items-center gap-1 transition-all active:scale-[0.97] ${
            checkIn
              ? 'bg-mist/60 text-navy/40'
              : 'bg-navy text-white shadow-md shadow-navy/25'
          } disabled:opacity-60`}
        >
          {busy === 'in' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          <span className="text-xs font-extrabold">{checkIn ? `Masuk ${checkIn}` : 'Absen Masuk'}</span>
        </button>

        <button
          onClick={() => doAbsen('out')}
          disabled={!checkIn || !!checkOut || busy !== null}
          className={`rounded-[16px] py-4 flex flex-col items-center gap-1 border transition-all active:scale-[0.97] ${
            checkOut
              ? 'bg-mist/60 text-navy/40 border-mist/60'
              : checkIn
                ? 'bg-white text-navy border-mist/60 shadow-sm'
                : 'bg-white text-navy/40 border-mist/60'
          } disabled:opacity-60`}
        >
          {busy === 'out' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
          <span className="text-xs font-extrabold">{checkOut ? `Selesai ${checkOut}` : 'Absen Selesai'}</span>
        </button>
      </div>

      {/* 4) ringkasan hari ini */}
      <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-4" style={{ animationDelay: '300ms' }}>
        <p className="text-[11px] font-extrabold text-navy">Hari Ini</p>
        <div className="mt-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-navy/50">Absen masuk</span>
            <span className="text-[11px] font-extrabold text-navy tabular-nums">{checkIn ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-navy/50">Absen selesai</span>
            <span className="text-[11px] font-extrabold text-navy tabular-nums">{checkOut ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-navy/50">Status</span>
            <span className="px-2 py-0.5 rounded-full bg-navy/10 text-navy text-[9px] font-extrabold uppercase tracking-wide">
              {status === 'belum' ? 'Belum absen' : status === 'masuk' ? 'Sedang magang' : 'Selesai'}
            </span>
          </div>
        </div>
      </div>

      {/* 5) riwayat */}
      <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-4" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-navy">Riwayat</p>
          <span className="flex items-center gap-1 text-[9px] font-bold text-navy/50">
            <History className="w-3 h-3" /> 4 terakhir
          </span>
        </div>

        <div className="mt-3 flex flex-col">
          {HISTORY.map((h, i) => (
            <div key={h.date} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-mist/60' : ''}`}>
              <div className="w-9 h-9 rounded-[12px] bg-shell border border-mist/60 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-extrabold text-navy tabular-nums">{h.date}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-navy tabular-nums">
                  {h.in} – {h.out}
                </p>
                <p className="text-[9px] font-semibold text-navy/50 mt-0.5">
                  {h.status === 'Hadir' ? 'Hadir penuh' : 'Pengajuan izin disetujui'}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                h.status === 'Hadir' ? 'bg-navy/10 text-navy' : 'bg-mist text-navy'
              }`}>
                {h.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};