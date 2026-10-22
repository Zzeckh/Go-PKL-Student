import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarX, RefreshCw } from 'lucide-react';
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

/* ── Baris rekap (typed) ── */
interface RecapRow {
  id: number;
  dateKey: string;
  dateLabel: string;
  masuk: string | null;
  pulang: string | null;
  jam: string | null;
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

/* ── Skeleton 4 baris shimmer ── */
const SkeletonRows: React.FC = () => (
  <div className="flex flex-col">
    {[0, 1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-3 px-1 py-3.5">
        <div className="h-3.5 w-16 rounded-full bg-mist/70 animate-pulse" />
        <div className="h-3.5 w-12 rounded-full bg-mist/70 animate-pulse ml-auto" />
        <div className="h-3.5 w-12 rounded-full bg-mist/70 animate-pulse" />
        <div className="h-3.5 w-14 rounded-full bg-mist/70 animate-pulse" />
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════
   REKAPAN HARIAN — tabel absensi per bulan + total.
   Header kartu: micro-label + judul 13px (pola tiket Home);
   durasi jadi chip navy; strip total tinted.
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
    <div className="bg-white rounded-[20px] border border-mist/60 shadow-sm p-4">
      {/* header kartu */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold text-navy/40 uppercase tracking-[0.14em]">Riwayat Absensi</p>
          <p className="text-[13px] font-extrabold text-navy leading-tight mt-0.5">Rekapan Harian</p>
        </div>
        <div className="bg-shell border border-mist/60 rounded-full px-1.5 py-1 flex items-center gap-1 shrink-0">
          <button
            onClick={() => setMonth(m => shiftMonth(m, -1))}
            aria-label="Bulan sebelumnya"
            className="w-7 h-7 rounded-full flex items-center justify-center text-navy/60 active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-extrabold text-navy tabular-nums px-1 min-w-[92px] text-center">
            {monthLabel(month)}
          </span>
          <button
            onClick={() => setMonth(m => shiftMonth(m, 1))}
            disabled={month >= thisMonthKey}
            aria-label="Bulan berikutnya"
            className="w-7 h-7 rounded-full flex items-center justify-center text-navy/60 active:scale-90 transition-transform disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* error — banner pola bersama */}
      {error && (
        <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-[12px] flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold text-red-600 leading-relaxed">{error}</p>
          <button
            onClick={() => load(month)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-navy text-white text-[9px] font-extrabold flex items-center gap-1 active:scale-95 transition-all"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Coba Lagi
          </button>
        </div>
      )}

      {!error && (
        <div className="mt-3">
          {/* header tabel */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-1 pb-2 border-b border-mist/60 text-[9px] font-extrabold uppercase tracking-wide text-navy/45">
            <span>Tanggal</span>
            <span className="w-12 text-right">Masuk</span>
            <span className="w-12 text-right">Pulang</span>
            <span className="w-16 text-right">Durasi</span>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <span className="w-12 h-12 rounded-full bg-navy/5 text-navy/30 flex items-center justify-center">
                <CalendarX className="w-5 h-5" />
              </span>
              <p className="text-[12px] font-bold text-navy/45">Belum ada absensi bulan ini</p>
              <p className="text-[10px] font-semibold text-navy/35">Data kehadiran akan muncul di sini</p>
            </div>
          ) : (
            <div className="divide-y divide-mist/60">
              {rows.map(r => (
                <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-1 py-3 items-center">
                  <span className="text-[12px] font-bold text-navy">{r.dateLabel}</span>
                  <span className={`w-12 text-right text-[12px] font-semibold tabular-nums ${r.masuk ? 'text-navy' : 'text-navy/30'}`}>
                    {r.masuk ?? '–'}
                  </span>
                  <span className={`w-12 text-right text-[12px] font-semibold tabular-nums ${r.pulang ? 'text-navy' : 'text-navy/30'}`}>
                    {r.pulang ?? '–'}
                  </span>
                  <span className="w-16 flex justify-end">
                    {r.jam ? (
                      <span className="px-2 py-0.5 rounded-full bg-navy/5 border border-navy/10 text-[10px] font-extrabold text-navy tabular-nums">
                        {r.jam}
                      </span>
                    ) : (
                      <span className="text-[12px] font-semibold text-navy/30 tabular-nums">–</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* strip total bulan */}
          {!loading && rows.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-[14px] bg-navy/5 border border-navy/15 px-3.5 py-2.5">
              <span className="text-[10px] font-bold text-navy/60">Total {monthLabel(month)}</span>
              <span className="text-[12px] font-extrabold text-navy tabular-nums">
                {hadir} hari · {totalJam}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};