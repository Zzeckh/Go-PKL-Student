import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarX } from 'lucide-react';
import { absensiService, type Absensi } from '../services/absensi';
import { fmtTimeID } from '../utils/date';

/* ── Helpers bulan (YYYY-MM) ── */
const monthKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const shiftMonth = (key: string, delta: number): string => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const monthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

const thisMonthKey = monthKey(new Date());

/* ── Baris rekap (typed, no any) ── */
interface RecapRow {
  id: number;
  dateKey: string;    // YYYY-MM-DD
  dateLabel: string;  // "17 Sep"
  masuk: string | null;
  pulang: string | null;
  jam: string | null; // "8j 4m" | null
}

const parseHM = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

const fmtDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}j` : `${h}j ${m}m`;
};

const toRow = (a: Absensi): RecapRow => {
  const inT = parseHM(a.checkInTime);
  const outT = parseHM(a.checkOutTime ?? null);
  const jam = inT !== null && outT !== null && outT > inT
    ? fmtDuration(Math.round((outT - inT) / 60000))
    : null;
  const [, m, d] = a.date.slice(0, 10).split('-');
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return {
    id: a.id,
    dateKey: a.date.slice(0, 10),
    dateLabel: `${Number(d)} ${MONTH_SHORT[Number(m) - 1] ?? ''}`.trim(),
    masuk: fmtTimeID(a.checkInTime),
    pulang: fmtTimeID(a.checkOutTime ?? null),
    jam,
  };
};

/* ── Skeleton 3 baris shimmer ── */
const SkeletonRows: React.FC = () => (
  <div className="flex flex-col">
    {[0, 1, 2].map(i => (
      <div key={i} className="flex items-center gap-3 px-1 py-3">
        <div className="h-3 w-16 rounded-full bg-mist/70 animate-pulse" />
        <div className="h-3 w-10 rounded-full bg-mist/70 animate-pulse ml-auto" />
        <div className="h-3 w-10 rounded-full bg-mist/70 animate-pulse" />
        <div className="h-3 w-12 rounded-full bg-mist/70 animate-pulse" />
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════
   REKAPAN HARIAN — tabel absensi per bulan + total,
   navigasi bulan (default: bulan berjalan).
   ══════════════════════════════════════════════════════ */
export const RekapanHarian: React.FC = () => {
  const [month, setMonth] = useState<string>(thisMonthKey);
  const [rows, setRows] = useState<RecapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await absensiService.listByMonth(key);
      setRows(list.map(toRow));
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat rekap absensi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  const hadir = rows.length;
  const totalMinutes = rows.reduce((sum, r) => {
    if (!r.jam) return sum;
    const m = r.jam.match(/(\d+)j(?:\s+(\d+)m)?/);
    if (!m) return sum;
    return sum + Number(m[1]) * 60 + Number(m[2] ?? 0);
  }, 0);
  const totalJam = fmtDuration(totalMinutes);

  return (
    <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-4" style={{ animationDelay: '300ms' }}>
      {/* header: judul + month pill */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Rekapan Harian</p>
        <div className="bg-shell border border-mist/60 rounded-full px-1.5 py-1 flex items-center gap-1">
          <button
            onClick={() => setMonth(m => shiftMonth(m, -1))}
            aria-label="Bulan sebelumnya"
            className="w-6 h-6 rounded-full flex items-center justify-center text-navy/60 active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-extrabold text-navy tabular-nums px-1">{monthLabel(month)}</span>
          <button
            onClick={() => setMonth(m => shiftMonth(m, 1))}
            disabled={month >= thisMonthKey}
            aria-label="Bulan berikutnya"
            className="w-6 h-6 rounded-full flex items-center justify-center text-navy/60 active:scale-90 transition-transform disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* error */}
      {error && (
        <p className="mt-3 text-[10px] font-bold text-red-500">{error}</p>
      )}

      {/* tabel */}
      {!error && (
        <div className="mt-2">
          {/* header row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-1 py-2 text-[9px] font-bold uppercase tracking-wide text-navy/50">
            <span>Tanggal</span>
            <span className="w-10 text-right">Masuk</span>
            <span className="w-10 text-right">Pulang</span>
            <span className="w-14 text-right">Jam</span>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-1.5">
              <CalendarX className="w-6 h-6 text-navy/30" />
              <p className="text-[11px] font-semibold text-navy/40">Belum ada absensi bulan ini</p>
            </div>
          ) : (
            <div className="divide-y divide-mist/60">
              {rows.map(r => (
                <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-1 py-2.5 items-center">
                  <span className="text-[11px] font-bold text-navy">{r.dateLabel}</span>
                  <span className="w-10 text-right text-[11px] font-semibold text-navy tabular-nums">{r.masuk ?? '–'}</span>
                  <span className="w-10 text-right text-[11px] font-semibold text-navy tabular-nums">{r.pulang ?? '–'}</span>
                  <span className="w-14 text-right text-[11px] font-semibold text-navy tabular-nums">{r.jam ?? '–'}</span>
                </div>
              ))}
            </div>
          )}

          {/* footer chip */}
          {!loading && rows.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-shell border border-mist/60 rounded-full px-3 py-1.5">
              <span className="text-[10px] font-bold text-navy/70 tabular-nums">
                {hadir} hari hadir · {totalJam} total
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

