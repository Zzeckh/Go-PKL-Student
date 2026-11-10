import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, LogIn, LogOut, MapPin, RefreshCw, Loader2,
  CheckCircle2, AlertCircle, XCircle, Building2, CalendarDays, ShieldCheck,
} from 'lucide-react';
import { SelfieCamera } from './SelfieCamera';
import type { TodayAttendance } from '../hooks/useTodayAttendance';
import { fmtTimeID } from '../utils/date';
import { distanceM } from '../utils/geo';

interface AbsensiViewProps {
  user: any;
  attendance: TodayAttendance;
  onClose: () => void;
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

/* ══════════════════════════════════════════════════════
   HALAMAN ABSENSI — dibuka lewat tombol "Absen" di dashboard.
   Membuka halaman ini TIDAK mencatat absensi. Pencatatan hanya
   terjadi saat pengguna menekan tombol Absen Masuk / Absen Pulang.
   ══════════════════════════════════════════════════════ */
export const AbsensiView: React.FC<AbsensiViewProps> = ({ user, attendance, onClose }) => {
  const { today, loading, error: loadError, acting, gps, refreshGps, checkIn, checkOut } = attendance;

  const [selfie, setSelfie] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const hasIn = !!today?.checkInTime;
  const hasOut = !!today?.checkOutTime;

  /* Tempat PKL & geofence dari data user (backend = source of truth) */
  const companyName: string = user?.companyName || 'Belum ditentukan';
  const companyAddress: string = user?.companyAddress || 'Alamat belum diatur';
  const fence = user?.companyLocation || null;
  const hasFence = !!(fence && fence.lat != null && fence.lng != null);
  const radius: number = fence?.radius ?? 500;

  const dist = gps.status === 'ok' && hasFence ? distanceM({ lat: gps.lat, lng: gps.lng }, fence) : null;
  /* Preview klien — validasi final tetap di server */
  const inFence = !hasFence || (dist !== null && dist <= radius);

  const reqSelfie = !!selfie;
  const reqLokasi = gps.status === 'ok' && inFence;
  const allReq = reqSelfie && reqLokasi;

  /* GPS baru diminta saat halaman absensi benar-benar dibuka. */
  useEffect(() => {
    refreshGps();
  }, [refreshGps]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const doCheckIn = async () => {
    if (!allReq) return;
    const ok = await checkIn();
    if (ok) {
      setSelfie(null);
      setNotice('Absen masuk tercatat.');
    }
  };

  const doCheckOut = async () => {
    if (!allReq) return;
    const ok = await checkOut();
    if (ok) {
      setSelfie(null);
      setNotice('Absen pulang tercatat.');
    }
  };

  const showForm = !hasOut;
  const submitError = acting === null ? loadError : null;

  return (
    <div className="fixed inset-0 z-50 bg-shell overflow-y-auto fade-in">
      <div className="px-5 pt-6 pb-[calc(28px+env(safe-area-inset-bottom))]">
        {/* ═══ HEADER ═══ */}
        <div className="rise-in flex items-center gap-3">
          <button
            onClick={onClose}
            aria-label="Kembali ke dashboard"
            className="w-10 h-10 rounded-full bg-white border border-mist/60 text-navy flex items-center justify-center active:scale-90 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-navy/50 flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" /> {fmtDate(new Date())}
            </p>
            <h1 className="text-xl font-extrabold text-navy tracking-tight">Absensi</h1>
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold shrink-0 ${
            !hasIn
              ? 'bg-white text-navy/50 border-navy/15'
              : !hasOut
                ? 'bg-navy text-white border-navy'
                : 'bg-navy/10 text-navy border-navy/15'
          }`}>
            {!hasIn ? 'Belum Absen' : !hasOut ? 'Berlangsung' : 'Selesai'}
          </span>
        </div>

        <p className="rise-in mt-4 flex items-start gap-2 rounded-[14px] bg-white border border-mist/60 px-3.5 py-2.5 text-[10px] font-semibold text-navy/55 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-navy/50 shrink-0 mt-0.5" />
          Membuka halaman ini tidak mencatat absensi. Absen baru tersimpan setelah kamu menekan tombol di bawah.
        </p>

        {notice && (
          <div className="rise-in mt-3 flex items-center gap-2 rounded-[14px] bg-navy px-3.5 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <p className="text-[10px] font-extrabold text-white">{notice}</p>
          </div>
        )}

        {/* ═══ CARD VERIFIKASI & ABSENSI ═══ */}
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-4" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-extrabold text-navy">Verifikasi & Absensi</p>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
              hasOut ? 'bg-navy/10 text-navy' : allReq ? 'bg-navy/10 text-navy' : 'bg-mist text-navy/60'
            }`}>
              {hasOut ? 'Lengkap' : allReq ? 'Siap absen' : 'Lengkapi syarat'}
            </span>
          </div>

          {showForm && (
            <>
              <SelfieCamera selfie={selfie} onSelfie={setSelfie} />
              <p className="mt-2 text-[9px] font-semibold text-navy/40">
                Foto hanya untuk verifikasi di layar — tidak disimpan ke server.
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
                    {gps.status === 'loading'
                      ? 'Mendeteksi lokasi GPS...'
                      : gps.status === 'error'
                        ? 'GPS bermasalah — cek izin lokasi'
                        : hasFence
                          ? `Berada dalam radius ${radius} m dari tempat PKL`
                          : 'Lokasi GPS terdeteksi'}
                  </p>
                  {gps.status === 'error' && (
                    <button
                      onClick={refreshGps}
                      className="ml-auto text-[9px] font-extrabold text-navy/60 flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" /> Coba
                    </button>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-[14px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-semibold text-red-600 leading-relaxed">{submitError}</p>
                </div>
              )}

              {/* tombol aksi — hanya ini yang mencatat absensi */}
              {!hasIn ? (
                <button
                  onClick={doCheckIn}
                  disabled={!allReq || acting !== null || loading}
                  className="mt-4 w-full bg-navy text-white rounded-[16px] py-4 flex flex-col items-center gap-1 shadow-md shadow-navy/25 transition-all active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
                >
                  {acting === 'in' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  <span className="text-xs font-extrabold">{acting === 'in' ? 'Mengirim absen masuk...' : 'Absen Masuk'}</span>
                </button>
              ) : (
                <button
                  onClick={doCheckOut}
                  disabled={!allReq || acting !== null || loading}
                  className="mt-4 w-full bg-navy text-white rounded-[16px] py-4 flex flex-col items-center gap-1 shadow-md shadow-navy/25 transition-all active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
                >
                  {acting === 'out' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                  <span className="text-xs font-extrabold">{acting === 'out' ? 'Mengirim absen pulang...' : 'Absen Pulang'}</span>
                </button>
              )}

              {!allReq && !submitError && (
                <p className="mt-3 flex items-center gap-1.5 text-[9px] font-semibold text-navy/40">
                  <AlertCircle className="w-3 h-3" /> Lengkapi selfie dan lokasi untuk membuka tombol absen.
                </p>
              )}
            </>
          )}

          {loading && !today && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-navy/40">
              <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa absensi hari ini...
            </p>
          )}

          {/* ringkasan waktu */}
          <div className={`grid grid-cols-[1fr_auto_1fr] items-end ${showForm ? 'mt-5 pt-4 border-t border-dashed border-mist' : 'mt-1'}`}>
            <div>
              <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-navy/40">Masuk</p>
              <p className={`text-[22px] font-extrabold tabular-nums leading-none mt-1.5 ${hasIn ? 'text-navy' : 'text-navy/20'}`}>
                {hasIn ? fmtTimeID(today!.checkInTime) : '--:--'}
              </p>
            </div>
            <div className="flex flex-col items-center px-3 pb-0.5">
              <span className={`px-2 py-1 rounded-full border text-[8px] font-extrabold ${
                hasIn && !hasOut ? 'bg-white border-navy/15 text-navy' : 'bg-white border-mist/60 text-navy/30'
              }`}>
                {hasIn && !hasOut ? 'aktif' : hasOut ? 'selesai' : '–'}
              </span>
              <div className="w-12 border-t-2 border-dashed border-mist mt-2" />
            </div>
            <div className="text-right">
              <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-navy/40">Pulang</p>
              <p className={`text-[22px] font-extrabold tabular-nums leading-none mt-1.5 ${hasOut ? 'text-navy' : 'text-navy/20'}`}>
                {hasOut ? fmtTimeID(today!.checkOutTime) : '--:--'}
              </p>
            </div>
          </div>

          {hasOut && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-[14px] bg-navy/5 border border-navy/15 px-3 py-3">
              <CheckCircle2 className="w-4 h-4 text-navy shrink-0" />
              <p className="text-[11px] font-extrabold text-navy">Absensi hari ini sudah lengkap.</p>
            </div>
          )}
        </div>

        {/* ═══ TEMPAT PKL ═══ */}
        <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-4" style={{ animationDelay: '160ms' }}>
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

          <div className="mt-3 flex items-center justify-between gap-2 rounded-[12px] bg-shell border border-mist/60 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-navy/60 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {gps.status === 'loading' && 'Mendeteksi lokasimu...'}
                {gps.status === 'error' && 'GPS tidak tersedia'}
                {gps.status === 'ok' && (!hasFence ? 'Geofence belum diatur' : `Jarakmu: ${dist} m`)}
              </span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
              inFence ? 'bg-navy/10 text-navy' : 'bg-mist text-navy/60'
            }`}>
              {gps.status !== 'ok' ? '—' : inFence ? 'Di dalam' : 'Di luar'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 rounded-full py-3 text-[11px] font-extrabold text-navy/60 bg-white border border-mist/60 active:scale-[0.98] transition-all"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
};
