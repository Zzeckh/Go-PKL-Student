import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, TrendingUp, Calendar } from 'lucide-react';
import { RekapanHarian } from './RekapanHarian';
import { absensiService } from '../services/absensi';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const fmtDuration = (minutes: number): string => {
  if (minutes <= 0) return '0j';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}j` : `${h}j ${m}m`;
};

const fmtAvg = (minutes: number): string => {
  if (minutes <= 0) return '–';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}.${String(Math.round((m / 60) * 10)).padStart(1, '0')}j`;
};

interface RekapViewProps {
  user: any;
}

/* ══════════════════════════════════════════════════════
   REKAP VIEW — hero navy + ringkasan bulan ini +
   tabel rekap bulanan (komponen RekapanHarian).
   ══════════════════════════════════════════════════════ */
export const RekapView: React.FC<RekapViewProps> = () => {
  const [stats, setStats] = useState<{ hadir: number; totalMinutes: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    absensiService
      .listByMonth(monthKey(new Date()))
      .then(rows => {
        if (cancelled) return;
        let totalMinutes = 0;
        let hadir = 0;
        for (const r of rows) {
          const inT = r.checkInTime ? new Date(r.checkInTime).getTime() : NaN;
          const outT = r.checkOutTime ? new Date(r.checkOutTime).getTime() : NaN;
          if (!Number.isNaN(inT) && !Number.isNaN(outT) && outT > inT) {
            totalMinutes += Math.round((outT - inT) / 60000);
            hadir += 1;
          }
        }
        setStats({ hadir, totalMinutes });
      })
      .catch(() => {
        if (!cancelled) setStats({ hadir: 0, totalMinutes: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const avgMinutes = stats && stats.hadir > 0 ? Math.round(stats.totalMinutes / stats.hadir) : 0;
  const now = new Date();
  const monthTitle = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="relative -mx-5 -mt-6">
      {/* ═══ HERO navy ═══ */}
      <div className="rise-in relative bg-navy px-5 pt-6 pb-16 shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-navy/90" />
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute top-28 -left-24 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative">
          <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.14em]">
            {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-white text-[26px] font-extrabold tracking-tight leading-tight mt-2">
            Rekap Kehadiran
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {monthTitle}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ WHITE SHEET ═══ */}
      <div className="relative -mt-8 bg-white rounded-t-[32px] px-5 pt-6 pb-32 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        {/* ringkasan bulan ini */}
        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Ringkasan Bulan Ini</p>

        <div className="rise-in mt-3 bg-white rounded-[20px] border border-mist/60 shadow-sm grid grid-cols-3 divide-x divide-mist/60" style={{ animationDelay: '100ms' }}>
          <div className="py-4 flex flex-col items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-navy/5 text-navy/60 flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5" />
            </span>
            <p className="text-[17px] font-extrabold text-navy tabular-nums leading-none">
              {loading ? '–' : stats?.hadir ?? 0}
            </p>
            <p className="text-[8px] font-extrabold text-navy/45 uppercase tracking-wide">Hari Hadir</p>
          </div>
          <div className="py-4 flex flex-col items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-navy/5 text-navy/60 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <p className="text-[17px] font-extrabold text-navy tabular-nums leading-none">
              {loading ? '–' : fmtDuration(stats?.totalMinutes ?? 0)}
            </p>
            <p className="text-[8px] font-extrabold text-navy/45 uppercase tracking-wide">Total Jam</p>
          </div>
          <div className="py-4 flex flex-col items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-navy/5 text-navy/60 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <p className="text-[17px] font-extrabold text-navy tabular-nums leading-none">
              {loading ? '–' : fmtAvg(avgMinutes)}
            </p>
            <p className="text-[8px] font-extrabold text-navy/45 uppercase tracking-wide">Rata-rata</p>
          </div>
        </div>

        {/* tabel rekap */}
        <div className="rise-in mt-6" style={{ animationDelay: '200ms' }}>
          <RekapanHarian />
        </div>
      </div>
    </div>
  );
};