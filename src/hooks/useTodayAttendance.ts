import { useState, useCallback, useEffect } from 'react';
import { absensiService, type Absensi } from '../services/absensi';
import { localToday, toISODate } from '../utils/date';

/* Opsi geolocation — sama dengan yang dipakai AbsensiView */
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/* Ambil koordinat sekarang (promise wrapper di atas getCurrentPosition) */
const getCoords = (): Promise<GeolocationCoordinates> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Perangkat tidak mendukung GPS.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(new Error(
        err.code === err.PERMISSION_DENIED
          ? 'Izin lokasi ditolak.'
          : err.code === err.TIMEOUT
            ? 'Waktu pengambilan lokasi habis.'
            : 'Lokasi tidak ditemukan.'
      )),
      GEO_OPTIONS
    );
  });

export type GpsState =
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lng: number; accuracy: number }
  | { status: 'error'; message: string };

export interface TodayAttendance {
  /** Baris absensi hari ini (null = belum ada) */
  today: Absensi | null;
  loading: boolean;
  /** Error yang terjadi saat load / aksi — tampilkan sebagai banner merah */
  error: string | null;
  /** true sedang proses check-in / check-out (spinner di tombol) */
  acting: 'in' | 'out' | null;
  /** GPS live untuk preview jarak ke geofence (seperti AbsensiView) */
  gps: GpsState;
  refreshGps: () => void;
  checkIn: () => Promise<boolean>;
  checkOut: () => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * State + aksi absensi HARI INI, dibagikan antara:
 * - Card "Absensi Hari Ini" di HomeView (StudentDashboard)
 * - AbsensiView (tab absensi)
 */
export const useTodayAttendance = (): TodayAttendance => {
  const [today, setToday] = useState<Absensi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<'in' | 'out' | null>(null);
  const [gps, setGps] = useState<GpsState>({ status: 'loading' });

  const refreshGps = useCallback(() => {
    setGps({ status: 'loading' });
    if (!('geolocation' in navigator)) {
      setGps({ status: 'error', message: 'Perangkat tidak mendukung GPS.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ status: 'ok', lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
      err => setGps({ status: 'error', message: err.code === err.PERMISSION_DENIED ? 'Izin lokasi ditolak.' : 'Lokasi tidak ditemukan.' }),
      GEO_OPTIONS
    );
  }, []);

  useEffect(() => {
    refreshGps();
  }, [refreshGps]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await absensiService.list();
      const t = localToday();
      setToday(all.find(a => toISODate(a.date) === t) || null);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat absensi hari ini.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const checkIn = useCallback(async (): Promise<boolean> => {
    setError(null);
    setActing('in');
    try {
      const coords = await getCoords();
      const created = await absensiService.checkIn(coords.latitude, coords.longitude, 'hadir');
      setToday(created);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Gagal absen masuk. Coba lagi.');
      return false;
    } finally {
      setActing(null);
    }
  }, []);

  const checkOut = useCallback(async (): Promise<boolean> => {
    setError(null);
    setActing('out');
    try {
      const coords = await getCoords();
      const updated = await absensiService.checkout(coords.latitude, coords.longitude);
      setToday(prev => (prev ? { ...prev, checkOutTime: updated.checkOutTime } : updated as Absensi));
      return true;
    } catch (err: any) {
      setError(err?.message || 'Gagal absen pulang. Coba lagi.');
      return false;
    } finally {
      setActing(null);
    }
  }, []);

  return { today, loading, error, acting, gps, refreshGps, checkIn, checkOut, reload };
};
