import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LogIn, MapPin, RefreshCw, Loader2, CheckCircle2, AlertCircle, History,
  Camera, Building2, XCircle, CalendarDays, X,
} from 'lucide-react';
import { absensiService, type Absensi } from '../services/absensi';
import { ABSENSI_STATUS_MAP, statusView } from '../utils/statusMap';
import { localToday, toISODate, fmtTimeID, fmtDM } from '../utils/date';

type Gps =
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lng: number; accuracy: number }
  | { status: 'error'; message: string };

const distanceM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

/* sub-teks riwayat berdasarkan status absensi */
const HISTORY_SUB: Record<string, string> = {
  hadir: 'Hadir penuh',
  izin: 'Izin tercatat',
  sakit: 'Sakit tercatat',
  alpha: 'Tanpa keterangan',
};

interface AbsensiViewProps {
  user: any;
}

export const AbsensiView: React.FC<AbsensiViewProps> = ({ user }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  const [gps, setGps] = useState<Gps>({ status: 'loading' });
  const [today, setToday] = useState<Absensi | null>(null);
  const [history, setHistory] = useState<Absensi[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [closingHistory, setClosingHistory] = useState(false);

  /* ── Tempat PKL dari data user (backend = source of truth) ── */
  const companyName: string = user?.companyName || 'Belum ditentukan';
  const companyAddress: string = user?.companyAddress || 'Alamat belum diatur';
  const fence = user?.companyLocation || null; // { lat, lng, radius } | null
  const hasFence = !!(fence && fence.lat != null && fence.lng != null);
  const RADIUS_M: number = fence?.radius ?? 500;

  /* ── Muat absensi hari ini + riwayat dari API ── */
  const load = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const all = await absensiService.list();
      const t = localToday();
      setToday(all.find(a => toISODate(a.date) === t) || null);
      setHistory(all.slice(0, 7));
    } catch (err: any) {
      setListError(err?.message || 'Gagal memuat data absensi.');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startCam = async () => {
    setCamError(null);
    setSelfie(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamOn(true);
    } catch {
      setCamOn(false);
      setCamError('Kamera tidak tersedia / izin ditolak.');
    }
  };

  useEffect(() => {
    startCam();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (camOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [camOn, selfie]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setSelfie(canvas.toDataURL('image/jpeg', 0.8));
  };

  const locate = () => {
    setGps({ status: 'loading' });
    if (!('geolocation' in navigator)) {
      setGps({ status: 'error', message: 'Perangkat tidak mendukung GPS.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ status: 'ok', lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
      err => setGps({ status: 'error', message: err.code === err.PERMISSION_DENIED ? 'Izin lokasi ditolak.' : 'Lokasi tidak ditemukan.' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dist = gps.status === 'ok' && hasFence ? distanceM({ lat: gps.lat, lng: gps.lng }, fence) : null;
  /* Client preview advisory — validasi final tetap di server */
  const inFence = !hasFence || (dist !== null && dist <= RADIUS_M);
  const reqSelfie = !!selfie;
  const reqLokasi = inFence;
  const allReq = reqSelfie && reqLokasi;

  const checkInLabel = today ? fmtTimeID(today.checkInTime) : null;

  const doAbsen = async () => {
    if (gps.status !== 'ok') {
      setSubmitError('Lokasi GPS belum siap. Tunggu sebentar lalu coba lagi.');
      return;
    }
    setBusy(true);
    setSubmitError(null);
    try {
      /* Backend yang memvalidasi geofence (403) & duplikat (409) */
      const created = await absensiService.checkIn(gps.lat, gps.lng, 'hadir');
      setToday(created);
      setHistory(prev => [created, ...prev].slice(0, 7));
    } catch (err: any) {
      setSubmitError(err?.message || 'Gagal absen. Coba lagi.');
    } finally {
      setBusy(false);
      setSelfie(null);
    }
  };

  const closeHistory = () => {
    setClosingHistory(true);
    setTimeout(() => {
      setShowHistory(false);
      setClosingHistory(false);
    }, 300);
  };

  const handleHistory = () => {
    if (showHistory) {
      closeHistory();
    } else {
      setShowHistory(true);
    }
  };

  return (
    <div className="relative">
      {/* ═══ HEADER ═══ */}
      <div className="rise-in flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold text-navy/50 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" /> {fmtDate(new Date())}
          </p>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight mt-1">Absensi</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold flex items-center gap-1.5 ${
            inFence ? 'bg-navy/10 border-navy/10 text-navy' : 'bg-mist/60 border-mist/60 text-navy/60'
          }`}>
            <MapPin className="w-3 h-3" />
            {gps.status === 'loading' && 'Mencari...'}
            {gps.status === 'error' && 'GPS error'}
            {gps.status === 'ok' && (!hasFence ? 'Tanpa geofence' : inFence ? `Di area · ${dist}m` : `Luar area · ${dist}m`)}
          </span>
          <button
            onClick={handleHistory}
            aria-label="Riwayat"
            className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-90 transition-all ${
              showHistory
                ? 'bg-navy text-white border-navy'
                : 'bg-white border-mist/60 text-navy/60'
            }`}
          >
            {showHistory ? <X className="w-4 h-4" /> : <History className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ═══ ERROR MUAT DATA ═══ */}
      {listError && (
        <div className="rise-in bg-white rounded-[20px] border border-red-200 shadow-sm p-4 mt-5 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-red-600 leading-relaxed">{listError}</p>
          </div>
          <button
            onClick={load}
            className="shrink-0 px-3 py-1.5 rounded-full bg-navy text-white text-[10px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Coba Lagi
          </button>
        </div>
      )}

      {/* ═══ 1) CARD VERIFIKASI & ABSENSI (GABUNGAN) ═══ */}
      <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-5" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-extrabold text-navy">Verifikasi & Absensi</p>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
            allReq ? 'bg-navy/10 text-navy' : 'bg-mist text-navy/60'
          }`}>
            {allReq ? 'Siap absen' : 'Lengkapi syarat'}
          </span>
        </div>

        {/* kamera selfie */}
        <div className="relative rounded-[16px] overflow-hidden bg-navy aspect-[4/3]">
          {selfie ? (
            <img src={selfie} alt="Selfie" className="w-full h-full object-cover -scale-x-100" />
          ) : (
            <video ref={videoRef} playsInline muted
              className={`w-full h-full object-cover -scale-x-100 ${camOn ? '' : 'opacity-0'}`} />
          )}

          {camError && !selfie && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
              <Camera className="w-6 h-6 text-white/50" />
              <p className="text-[10px] font-semibold text-white/60">{camError}</p>
              <button onClick={startCam} className="px-3 py-1.5 rounded-full bg-white text-navy text-[10px] font-extrabold active:scale-95 transition-all">
                Coba Lagi
              </button>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            {selfie ? (
              <button onClick={() => setSelfie(null)} className="px-4 py-2 rounded-full bg-white text-navy text-[10px] font-extrabold shadow-md active:scale-95 transition-all flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Ulangi Foto
              </button>
            ) : (
              <button onClick={capture} disabled={!camOn} aria-label="Ambil foto"
                className="w-14 h-14 rounded-full bg-white border-4 border-navy/20 shadow-md active:scale-90 transition-all disabled:opacity-40 flex items-center justify-center">
                <Camera className="w-6 h-6 text-navy" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-[9px] font-semibold text-navy/40">
          Foto hanya untuk verifikasi — tidak disimpan ke server.
        </p>

        {/* checklist syarat */}
        <div className="mt-4 pt-4 border-t border-mist/60 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            {reqSelfie ? <CheckCircle2 className="w-4 h-4 text-navy" /> : <XCircle className="w-4 h-4 text-navy/30" />}
            <p className={`text-[10px] font-bold ${reqSelfie ? 'text-navy' : 'text-navy/40'}`}>Foto selfie terambil</p>
          </div>
          <div className="flex items-center gap-2.5">
            {reqLokasi ? <CheckCircle2 className="w-4 h-4 text-navy" /> : <XCircle className="w-4 h-4 text-navy/30" />}
            <p className={`text-[10px] font-bold ${reqLokasi ? 'text-navy' : 'text-navy/40'}`}>
              {hasFence
                ? `Berada dalam radius ${RADIUS_M} m dari tempat PKL`
                : 'Lokasi GPS terdeteksi (tempat PKL belum punya geofence)'}
            </p>
          </div>
        </div>

        {/* error dari backend (geofence 403 / duplikat 409 / dsb.) */}
        {submitError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-[16px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-red-600 leading-relaxed">{submitError}</p>
          </div>
        )}

        {/* tombol absen masuk — backend hanya mendukung check-in */}
        <button
          onClick={doAbsen}
          disabled={!allReq || !!today || busy || listLoading}
          className={`w-full mt-4 rounded-[16px] py-4 flex flex-col items-center gap-1 transition-all active:scale-[0.97] disabled:opacity-50 ${
            today ? 'bg-mist/60 text-navy/40' : 'bg-navy text-white shadow-md shadow-navy/25'
          }`}
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          <span className="text-xs font-extrabold">
            {busy ? 'Mengirim...' : today ? (checkInLabel ? `Masuk ${checkInLabel}` : 'Sudah absen hari ini') : 'Absen Masuk'}
          </span>
        </button>

        {listLoading && !today && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-navy/40">
            <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa absensi hari ini...
          </p>
        )}

        {!allReq && !today && (
          <p className="mt-3 flex items-center gap-1.5 text-[9px] font-semibold text-navy/40">
            <AlertCircle className="w-3 h-3" /> Lengkapi kedua syarat untuk membuka tombol absen.
          </p>
        )}
      </div>

      {/* ═══ 2) CARD TEMPAT PKL ═══ */}
      <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-4" style={{ animationDelay: '200ms' }}>
        <p className="text-[11px] font-extrabold text-navy">Tempat PKL</p>

        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-navy text-white flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-navy truncate">{companyName}</p>
            <p className="text-[10px] font-semibold text-navy/50 truncate">{companyAddress}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-[12px] bg-shell border border-mist/60 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-navy/60">
            <MapPin className="w-3 h-3" />
            {gps.status === 'loading' && 'Mendeteksi lokasimu...'}
            {gps.status === 'error' && 'GPS tidak tersedia'}
            {gps.status === 'ok' && (!hasFence ? 'Geofence belum diatur' : `Jarakmu: ${dist} m`)}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
            inFence ? 'bg-navy/10 text-navy' : 'bg-mist text-navy/60'
          }`}>
            {inFence ? 'Di dalam' : 'Di luar'}
          </span>
        </div>
      </div>

      {/* ═══ POPOVER RIWAYAT ═══ */}
      {showHistory && (
        <div className={`${closingHistory ? 'pop-out' : 'pop-in'} absolute right-0 top-[68px] z-40 w-72 bg-white rounded-[16px] border border-mist/60 shadow-lg shadow-navy/15 p-3`}>
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-extrabold text-navy">Riwayat Kehadiran</p>
            <span className="px-1.5 py-0.5 rounded-full bg-shell border border-mist/60 text-[8px] font-bold text-navy/60">
              {history.length} terakhir
            </span>
          </div>

          <div className="mt-2 flex flex-col">
            {history.length === 0 && (
              <p className="px-1 py-3 text-[10px] font-semibold text-navy/40 text-center">
                {listLoading ? 'Memuat riwayat...' : 'Belum ada riwayat absensi.'}
              </p>
            )}

            {history.map((a, i) => {
              const sv = statusView(ABSENSI_STATUS_MAP, a.status);
              return (
                <div key={a.id} className={`flex items-center gap-2.5 px-1 py-2.5 ${i > 0 ? 'border-t border-mist/60' : ''}`}>
                  <div className="w-8 h-8 rounded-[10px] bg-shell border border-mist/60 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-extrabold text-navy tabular-nums">{fmtDM(a.date)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-navy tabular-nums">
                      {fmtTimeID(a.checkInTime) ? `Masuk ${fmtTimeID(a.checkInTime)}` : 'Tanpa check-in'}
                    </p>
                    <p className="text-[9px] font-semibold text-navy/50 mt-0.5">{HISTORY_SUB[a.status] || '—'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold ${sv.chipClass}`}>
                    {sv.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
