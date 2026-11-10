import React, { useEffect, useState } from 'react';
import {
  AlertCircle, BadgeCheck, GraduationCap, Loader2, RefreshCw, Target,
} from 'lucide-react';
import {
  formatSignatureDate, learningService,
  type Achievement, type LearningGoal,
} from '../services/learning';

interface LearningPanelProps {
  studentId?: number | null;
}

/* ══════════════════════════════════════════════════════
   CAPAIAN & TUJUAN PEMBELAJARAN — mode LIHAT SAJA (read-only).
   Ditampilkan di dalam tab Jurnal dengan kartu (bukan tabel)
   agar nyaman dibaca di layar HP. Tidak ada aksi tambah / ubah /
   hapus di sini; pengelolaan tetap di aplikasi web.
   ══════════════════════════════════════════════════════ */

const IntroCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-[12px] bg-navy text-white flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-navy/40">Jurnal PKL</p>
        <h2 className="text-base font-extrabold text-navy leading-tight">{title}</h2>
      </div>
      <span className="px-2 py-1 rounded-full bg-shell border border-mist/60 text-[8px] font-extrabold text-navy/50 shrink-0">
        Lihat saja
      </span>
    </div>
    <p className="mt-3 text-[10px] font-semibold text-navy/50 leading-relaxed">{description}</p>
  </div>
);

const StateCard: React.FC<{
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  onRetry?: () => void;
}> = ({ loading, error, empty, emptyTitle, emptyText, onRetry }) => {
  if (loading) {
    return (
      <div className="rise-in bg-white rounded-[20px] border border-mist/60 p-8 text-center">
        <Loader2 className="w-6 h-6 text-navy/30 mx-auto animate-spin" />
        <p className="text-[11px] font-bold text-navy/40 mt-2">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rise-in bg-white rounded-[20px] border border-red-200 shadow-sm p-4 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold text-red-600 leading-relaxed">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 px-3 py-1.5 rounded-full bg-navy text-white text-[10px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Coba Lagi
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rise-in bg-white rounded-[20px] border border-mist/60 p-8 text-center">
        <div className="w-12 h-12 rounded-[14px] bg-navy/5 text-navy/40 flex items-center justify-center mx-auto">
          <GraduationCap className="w-6 h-6" />
        </div>
        <p className="text-[11px] font-bold text-navy/50 mt-3">{emptyTitle}</p>
        <p className="text-[10px] font-semibold text-navy/35 mt-1 leading-relaxed">{emptyText}</p>
      </div>
    );
  }

  return null;
};

/* Ringkasan kecil di atas daftar kartu */
const SummaryStrip: React.FC<{
  items: { value: React.ReactNode; label: string }[];
}> = ({ items }) => (
  <div
    className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm grid divide-x divide-mist/60"
    style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
  >
    {items.map(item => (
      <div key={item.label} className="py-3.5 flex flex-col items-center gap-1">
        <p className="text-[17px] font-extrabold text-navy tabular-nums leading-none">{item.value}</p>
        <p className="text-[8px] font-extrabold text-navy/45 uppercase tracking-wide text-center px-1">
          {item.label}
        </p>
      </div>
    ))}
  </div>
);

const WeekChips: React.FC<{ weeks: number[] }> = ({ weeks }) =>
  weeks.length > 0 ? (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {weeks.map(week => (
        <span
          key={week}
          className="min-w-6 h-6 px-1.5 rounded-[7px] bg-navy/5 border border-navy/10 text-[9px] font-extrabold text-navy flex items-center justify-center tabular-nums"
        >
          {week}
        </span>
      ))}
    </div>
  ) : (
    <p className="mt-1 text-[10px] font-semibold text-navy/35">Minggu belum ditentukan</p>
  );

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-navy/40">{children}</p>
);

const SignatureTile: React.FC<{
  label: string;
  signedAt: string | null;
  name?: string | null;
}> = ({ label, signedAt, name }) => (
  <div className={`rounded-[12px] border px-2.5 py-2 bg-white ${signedAt ? 'border-navy/15' : 'border-mist/60'}`}>
    <SectionLabel>{label}</SectionLabel>
    {signedAt ? (
      <>
        <div className="flex items-center gap-1.5 mt-1 min-w-0">
          <BadgeCheck className="w-3.5 h-3.5 text-navy shrink-0" />
          <p className="text-[10px] font-bold text-navy truncate">{name || 'Pembimbing'}</p>
        </div>
        <p className="text-[8px] font-semibold text-navy/40 mt-0.5">{formatSignatureDate(signedAt)}</p>
      </>
    ) : (
      <p className="text-[10px] font-semibold text-navy/35 mt-1">Belum</p>
    )}
  </div>
);

const AchievementCard: React.FC<{ item: Achievement; index: number }> = ({ item, index }) => (
  <div
    className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm overflow-hidden"
    style={{ animationDelay: `${100 + index * 60}ms` }}
  >
    <div className="p-4">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-[10px] bg-navy text-white flex items-center justify-center text-[10px] font-extrabold tabular-nums shrink-0">
          {item.orderIndex}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-navy leading-snug">{item.title || 'Capaian belum diisi'}</p>
          <WeekChips weeks={item.weeks} />
        </div>
      </div>

      <div className="mt-3 rounded-[12px] bg-shell/70 border border-mist/50 p-3">
        <SectionLabel>Bukti Pembelajaran</SectionLabel>
        <p className="mt-1 text-[10px] font-semibold text-navy/65 leading-relaxed whitespace-pre-wrap">
          {item.evidence || 'Belum ada bukti pembelajaran.'}
        </p>
      </div>
    </div>

    <div className="px-4 py-3 bg-shell/40 border-t border-mist/60 grid grid-cols-2 gap-2">
      <SignatureTile label="Paraf Mentor" signedAt={item.mentorSignedAt} name={item.mentorSignedBy?.name} />
      <SignatureTile label="Paraf Sekolah" signedAt={item.teacherSignedAt} name={item.teacherSignedBy?.name} />
    </div>
  </div>
);

const GoalCard: React.FC<{ item: LearningGoal; index: number }> = ({ item, index }) => (
  <div
    className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4"
    style={{ animationDelay: `${100 + index * 60}ms` }}
  >
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-[10px] bg-navy text-white flex items-center justify-center text-[10px] font-extrabold tabular-nums shrink-0">
        {item.orderIndex}
      </span>
      <p className="flex-1 text-xs font-bold text-navy leading-snug">{item.title || 'Tujuan belum diisi'}</p>
      <span
        className={`min-w-9 h-8 px-2 rounded-[10px] text-[12px] font-extrabold tabular-nums flex items-center justify-center shrink-0 ${
          item.score != null ? 'bg-navy text-white' : 'bg-shell text-navy/35 border border-mist/60'
        }`}
      >
        {item.score != null ? item.score : '—'}
      </span>
    </div>

    <div className="mt-3 rounded-[12px] bg-shell/70 border border-mist/50 p-3">
      <SectionLabel>Deskripsi Penilaian</SectionLabel>
      <p className="mt-1 text-[10px] font-semibold text-navy/65 leading-relaxed whitespace-pre-wrap">
        {item.description || 'Belum ada deskripsi dari mentor.'}
      </p>
    </div>
  </div>
);

/* ════════════════════ CAPAIAN PEMBELAJARAN ════════════════════ */
export const AchievementsPanel: React.FC<LearningPanelProps> = ({ studentId }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!studentId) {
      setAchievements([]);
      setLoading(false);
      setError('Data siswa belum tersedia.');
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    learningService
      .getAchievements(studentId)
      .then(payload => {
        if (active) setAchievements(payload.achievements ?? []);
      })
      .catch((err: any) => {
        if (active) setError(err?.message || 'Gagal memuat capaian pembelajaran.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId, reloadKey]);

  const uniqueWeeks = new Set<number>();
  achievements.forEach(item => item.weeks.forEach(week => uniqueWeeks.add(week)));
  const signedCount = achievements.filter(item => item.mentorSignedAt && item.teacherSignedAt).length;

  return (
    <div className="flex flex-col gap-3">
      <IntroCard
        icon={GraduationCap}
        title="Capaian Pembelajaran"
        description="Capaian yang tercatat pada jurnal PKL-mu, lengkap dengan bukti, minggu pelaksanaan, dan paraf pembimbing. Data hanya dapat dilihat."
      />

      <StateCard
        loading={loading}
        error={error}
        onRetry={() => setReloadKey(k => k + 1)}
        empty={!loading && !error && achievements.length === 0}
        emptyTitle="Belum ada capaian pembelajaran"
        emptyText="Mentor pembimbing belum menambahkan capaian untuk jurnalmu."
      />

      {!loading && !error && achievements.length > 0 && (
        <>
          <SummaryStrip
            items={[
              { value: achievements.length, label: 'Capaian' },
              { value: uniqueWeeks.size, label: 'Minggu' },
              { value: `${signedCount}/${achievements.length}`, label: 'Paraf Lengkap' },
            ]}
          />

          {achievements.map((item, index) => (
            <AchievementCard key={item.id} item={item} index={index} />
          ))}
        </>
      )}
    </div>
  );
};

/* ════════════════════ TUJUAN PEMBELAJARAN ════════════════════ */
export const GoalsPanel: React.FC<LearningPanelProps> = ({ studentId }) => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!studentId) {
      setGoals([]);
      setLoading(false);
      setError('Data siswa belum tersedia.');
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    learningService
      .getGoals(studentId)
      .then(payload => {
        if (active) setGoals(payload.goals ?? []);
      })
      .catch((err: any) => {
        if (active) setError(err?.message || 'Gagal memuat tujuan pembelajaran.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId, reloadKey]);

  const scored = goals.filter(item => item.score != null);
  const average = scored.length > 0
    ? Math.round((scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length) * 10) / 10
    : null;

  return (
    <div className="flex flex-col gap-3">
      <IntroCard
        icon={Target}
        title="Tujuan Pembelajaran"
        description="Tujuan pembelajaran yang dinilai mentor untuk kegiatan PKL-mu. Nilai dan deskripsi bersifat lihat saja."
      />

      <StateCard
        loading={loading}
        error={error}
        onRetry={() => setReloadKey(k => k + 1)}
        empty={!loading && !error && goals.length === 0}
        emptyTitle="Belum ada tujuan pembelajaran"
        emptyText="Mentor pembimbing belum mengisi tujuan pembelajaran."
      />

      {!loading && !error && goals.length > 0 && (
        <>
          <SummaryStrip
            items={[
              { value: goals.length, label: 'Tujuan' },
              { value: scored.length, label: 'Dinilai' },
              { value: average != null ? average : '—', label: 'Rata-rata' },
            ]}
          />

          {goals.map((item, index) => (
            <GoalCard key={item.id} item={item} index={index} />
          ))}
        </>
      )}
    </div>
  );
};
