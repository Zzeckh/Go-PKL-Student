import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, TrendingUp, Timer } from 'lucide-react';
import { TopoPattern } from './Decor';
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
   REKAP VIEW — header POLA SAMA DENGAN Izin:
   label kecil ber-icon → judul 3xl + angka besar kanan →
   3 chip kaca statistik. Sheet langsung tabel rekap.
   ══════════════════════════════════════════════════════ */
export const RekapView: React.FC<RekapViewProps> = () => {
  const [stats, setStats] = useState<{ hadir: number; totalMinutes: number; maxMinutes: number } | null>(null);
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
        let maxMinutes = 0;
        for (const r of rows) {
          const inT = r.checkInTime ? new Date(r.checkInTime).getTime() : NaN;
          const outT = r.checkOutTime ? new Date(r.checkOutTime).getTime() : NaN;
          if (!Number.isNaN(inT) && !Number.isNaN(outT) && outT > inT) {
            const mins = Math.round((outT - inT) / 60000);
            totalMinutes += mins;
            hadir += 1;
            if (mins > maxMinutes) maxMinutes = mins;
          }
        }
        setStats({ hadir, totalMinutes, maxMinutes });
      })
      .catch(() => {
        if (!cancelled) setStats({ hadir: 0, totalMinutes: 0, maxMinutes: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const avgMinutes = stats && stats.hadir > 0 ? Math.round(stats.totalMinutes / stats.hadir) : 0;
  const now = new Date();
  const monthTitle = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="relative -mx-5 min-h-full flex flex-col bg-white">
      {/* ═══ HERO NAVY — pola header identik Izin ═══ */}
      <div className="rise-in relative bg-navy px-5 pt-6 pb-16 shrink-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <TopoPattern />
        </div>

        <div className="relative">
          {/* judul + angka besar */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/60 text-[10px] font-semibold flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" /> Rekap magang · {monthTitle}
              </p>
              <h1 className="text-white text-3xl font-extrabold tracking-tight mt-1">Kehadiran</h1>
            </div>
            <div className="text-right">
              <p className="text-white text-3xl font-extrabold tabular-nums leading-none">
                {loading ? '–' : stats?.hadir ?? 0}
              </p>
              <p className="text-white/60 text-[10px] font-bold mt-1">hari hadir</p>
            </div>
          </div>

          {/* 3 chip kaca statistik — pola chip Izin */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="rounded-[14px] border bg-white/10 border-white/15 text-white p-2.5 flex flex-col items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-extrabold tabular-nums leading-none">
                {loading ? '–' : fmtDuration(stats?.totalMinutes ?? 0)}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wide text-white/60">Total Jam</span>
            </div>

            <div className="rounded-[14px] border bg-white/10 border-white/15 text-white p-2.5 flex flex-col items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-extrabold tabular-nums leading-none">
                {loading ? '–' : fmtAvg(avgMinutes)}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wide text-white/60">Rata-rata</span>
            </div>

            <div className="rounded-[14px] border bg-white/10 border-white/15 text-white p-2.5 flex flex-col items-center gap-1">
              <Timer className="w-4 h-4" />
              <span className="text-sm font-extrabold tabular-nums leading-none">
                {loading ? '–' : fmtDuration(stats?.maxMinutes ?? 0)}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wide text-white/60">Terlama</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ WHITE SHEET overlap — langsung tabel ═══ */}
      <div className="relative -mt-8 flex-1 bg-white rounded-t-[32px] px-5 pt-6 pb-24 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="rise-in" style={{ animationDelay: '100ms' }}>
          <RekapanHarian />
        </div>
      </div>
    </div>
  );
};