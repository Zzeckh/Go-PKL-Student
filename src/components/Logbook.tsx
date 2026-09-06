import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen, Clock, CheckCircle2, Loader2, Plus, Pencil, X, CalendarDays, FileText, ChevronDown,
} from 'lucide-react';

type LogStatus = 'disetujui' | 'pending' | 'revisi';

type LogbookEntry = {
  id: number;
  iso: string;
  title: string;
  hours: number;
  status: LogStatus;
  note?: string;
};

const INITIAL_LOGBOOKS: LogbookEntry[] = [
  { id: 1, iso: '2026-02-16', title: 'Membuat fitur laporan harian', hours: 8,   status: 'disetujui' },
  { id: 2, iso: '2026-02-15', title: 'Testing & perbaikan bug API',  hours: 7.5, status: 'pending' },
  { id: 3, iso: '2026-02-14', title: 'Desain halaman absensi GPS',   hours: 8,   status: 'disetujui' },
  { id: 4, iso: '2026-02-13', title: 'Integrasi API logbook',        hours: 6,   status: 'revisi', note: 'Deskripsi terlalu singkat, lengkapi detail kegiatan.' },
  { id: 5, iso: '2026-02-12', title: 'Riset geofence & dokumentasi', hours: 8,   status: 'disetujui' },
  { id: 6, iso: '2026-02-11', title: 'Setup environment & onboarding', hours: 4, status: 'disetujui' },
];

type Filter = 'semua' | LogStatus;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'semua',     label: 'Semua' },
  { id: 'disetujui', label: 'Disetujui' },
  { id: 'pending',   label: 'Pending' },
  { id: 'revisi',    label: 'Revisi' },
];

const PAGE_SIZE = 3;

const fmtDM = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const fmtHours = (h: number) => String(h).replace('.', ',');

const StatusChip: React.FC<{ status: LogStatus }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide ${
    status === 'disetujui' ? 'bg-navy/10 text-navy' :
    status === 'pending'   ? 'bg-mist text-navy/60' :
    'bg-white border border-mist text-navy/60'
  }`}>
    {status}
  </span>
);

const StatTile: React.FC<{ icon: React.ElementType; value: string | number; label: string }> = ({ icon: Icon, value, label }) => (
  <div className="rounded-[16px] bg-navy p-3.5 shadow-md shadow-navy/20">
    <div className="flex items-center justify-between">
      <span className="w-8 h-8 rounded-[10px] bg-white/15 text-white flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
      <p className="text-xl font-extrabold text-white tabular-nums">{value}</p>
    </div>
    <p className="text-[9px] font-bold text-white/60 uppercase tracking-wide mt-2">{label}</p>
  </div>
);

export const LogbookView: React.FC = () => {
  const [entries, setEntries] = useState<LogbookEntry[]>(INITIAL_LOGBOOKS);
  const [filter, setFilter] = useState<Filter>('semua');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [sheet, setSheet] = useState<null | { mode: 'add' } | { mode: 'edit'; entry: LogbookEntry }>(null);
  const [closingSheet, setClosingSheet] = useState(false);
  const [form, setForm] = useState({ iso: '', title: '', hours: '' });
  const dateRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [filter]);

  const total = entries.length;
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const approved = entries.filter(e => e.status === 'disetujui').length;
  const pending = entries.filter(e => e.status === 'pending').length;

  const shown = filter === 'semua' ? entries : entries.filter(e => e.status === filter);
  const visible = shown.slice(0, limit);
  const extended = limit > PAGE_SIZE;

  const openAdd = () => {
    setForm({ iso: '', title: '', hours: '' });
    setSheet({ mode: 'add' });
  };

  const openEdit = (entry: LogbookEntry) => {
    setForm({ iso: entry.iso, title: entry.title, hours: String(entry.hours) });
    setSheet({ mode: 'edit', entry });
  };

  const closeSheet = () => {
    setClosingSheet(true);
    setTimeout(() => {
      setSheet(null);
      setClosingSheet(false);
    }, 300);
  };

  const save = () => {
    if (!form.title.trim() || !form.hours) return;
    const hours = parseFloat(form.hours) || 0;
    if (sheet?.mode === 'add') {
      const iso = form.iso || new Date().toISOString().slice(0, 10);
      setEntries(prev => [{ id: Date.now(), iso, title: form.title.trim(), hours, status: 'pending' }, ...prev]);
    } else if (sheet?.mode === 'edit') {
      setEntries(prev =>
        prev.map(e =>
          e.id === sheet.entry.id
            ? { ...e, iso: form.iso || e.iso, title: form.title.trim(), hours, status: 'pending', note: undefined }
            : e
        )
      );
    }
    closeSheet();
  };

  const openDatePicker = () => {
    try {
      (dateRef.current as any)?.showPicker?.();
    } catch {
      dateRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      {/* ═══ HEADER ═══ */}
      <div className="rise-in">
        <p className="text-[10px] font-semibold text-navy/50 flex items-center gap-1.5">
          <CalendarDays className="w-3 h-3" /> Laporan kegiatan magang
        </p>
        <h1 className="text-2xl font-extrabold text-navy tracking-tight mt-1">Logbook</h1>
      </div>

      {/* ═══ 1) STATS ═══ */}
      <div className="rise-in grid grid-cols-2 gap-3 mt-5" style={{ animationDelay: '100ms' }}>
        <StatTile icon={BookOpen}     value={total}                label="Total Logbook" />
        <StatTile icon={Clock}        value={fmtHours(totalHours)} label="Total Jam" />
        <StatTile icon={CheckCircle2} value={approved}             label="Disetujui" />
        <StatTile icon={Loader2}      value={pending}              label="Pending" />
      </div>

      {/* ═══ 2) FILTER ═══ */}
      <div className="rise-in grid grid-cols-4 gap-2 mt-4" style={{ animationDelay: '200ms' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`w-full py-2.5 rounded-full text-[10px] font-extrabold transition-all active:scale-95 ${
              filter === f.id
                ? 'bg-navy text-white shadow-md shadow-navy/25'
                : 'bg-white text-navy/60 border border-mist/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ═══ 3) LIST ═══ */}
      <div key={filter} className="flex flex-col gap-3 mt-4">
        {visible.length === 0 && (
          <div className="rise-in bg-white rounded-[20px] border border-mist/60 p-8 text-center" style={{ animationDelay: '250ms' }}>
            <FileText className="w-6 h-6 text-navy/30 mx-auto" />
            <p className="text-[11px] font-bold text-navy/40 mt-2">Belum ada logbook di filter ini.</p>
          </div>
        )}

        {visible.map((e, i) => (
          <div
            key={e.id}
            className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4"
            style={{ animationDelay: `${250 + i * 70}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-navy text-white flex items-center justify-center shrink-0">
                <span className="text-[9px] font-extrabold tabular-nums">{fmtDM(e.iso)}</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-navy leading-snug">{e.title}</p>
                <p className="text-[10px] font-semibold text-navy/50 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {fmtHours(e.hours)} jam
                </p>
                {e.status === 'revisi' && e.note && (
                  <p className="mt-2 text-[9px] font-semibold text-navy/60 bg-shell border border-mist/60 rounded-[10px] px-2.5 py-1.5 leading-relaxed">
                    Catatan mentor: {e.note}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusChip status={e.status} />
                {e.status === 'revisi' && (
                  <button
                    onClick={() => openEdit(e)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-navy text-white text-[9px] font-extrabold active:scale-95 transition-all"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {shown.length > PAGE_SIZE && (
          <button
            onClick={() => setLimit(l => (l === PAGE_SIZE ? shown.length : PAGE_SIZE))}
            className="rise-in w-full bg-white border border-mist/60 rounded-full py-3 text-[10px] font-extrabold text-navy/70 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            style={{ animationDelay: '450ms' }}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${extended ? 'rotate-180' : ''}`} />
            {extended ? 'Sembunyikan' : `Tampilkan Lebih Banyak (${shown.length - PAGE_SIZE} lagi)`}
          </button>
        )}
      </div>

      {/* ═══ FAB ═══ */}
      <button
        onClick={openAdd}
        aria-label="Tambah logbook"
        className="rise-in fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-navy text-white shadow-lg shadow-navy/30 flex items-center justify-center active:scale-90 transition-all"
        style={{ animationDelay: '400ms' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ═══ BOTTOM-SHEET FORM ═══ */}
      {sheet && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-navy/30 ${closingSheet ? 'fade-out' : 'fade-in'}`}
            onClick={closeSheet}
          />

          <div className={`absolute inset-x-0 bottom-0 bg-white rounded-t-[32px] px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] ${closingSheet ? 'sheet-modal-out' : 'sheet-modal-in'}`}>
            <div className="w-10 h-1.5 bg-mist rounded-full mx-auto" />

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm font-extrabold text-navy">
                {sheet.mode === 'add' ? 'Tambah Logbook' : 'Edit Logbook'}
              </p>
              <button onClick={closeSheet} aria-label="Tutup" className="w-8 h-8 rounded-full bg-shell border border-mist/60 text-navy/60 flex items-center justify-center active:scale-90 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sheet.mode === 'edit' && (
              <p className="mt-2 text-[10px] font-semibold text-navy/50 bg-shell border border-mist/60 rounded-[10px] px-2.5 py-1.5">
                Setelah disimpan, logbook dikirim ulang sebagai <b>pending</b> untuk direview mentor.
              </p>
            )}

            <div className="mt-4">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">Tanggal</label>
              <div className="relative">
                <input
                  ref={dateRef}
                  type="date"
                  value={form.iso}
                  onChange={e => setForm(f => ({ ...f, iso: e.target.value }))}
                  className="w-full bg-shell border border-mist/60 rounded-[12px] pl-3 pr-10 py-2.5 text-xs font-semibold text-navy"
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  aria-label="Pilih tanggal"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/60 active:scale-90 transition-all"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">Kegiatan</label>
              <textarea
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Contoh: Membuat halaman laporan harian..."
                rows={3}
                className="w-full bg-shell border border-mist/60 rounded-[12px] px-3 py-2.5 text-xs font-semibold text-navy resize-none"
              />
            </div>

            <div className="mt-3">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">Durasi (jam)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                placeholder="8"
                className="w-full bg-shell border border-mist/60 rounded-[12px] px-3 py-2.5 text-xs font-semibold text-navy"
              />
            </div>

            <button
              onClick={save}
              disabled={!form.title.trim() || !form.hours}
              className="mt-5 w-full bg-navy text-white rounded-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {sheet.mode === 'add' ? (<><Plus className="w-4 h-4" /> Kirim Logbook</>) : (<><Pencil className="w-4 h-4" /> Simpan Perubahan</>)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};