import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen, Clock, CheckCircle2, Loader2, Plus, Pencil, X, CalendarDays, FileText, ChevronDown, AlertCircle, RefreshCw,
} from 'lucide-react';
import { logbookService, type Logbook } from '../services/logbook';
import { LOGBOOK_STATUS_MAP, statusView } from '../utils/statusMap';
import { toISODate } from '../utils/date';

type Filter = 'semua' | 'pending' | 'approved' | 'rejected';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'semua',    label: 'Semua' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'pending',  label: 'Pending' },
  { id: 'rejected', label: 'Revisi' },
];

const PAGE_SIZE = 3;

const fmtHours = (h: number) => String(h).replace('.', ',');

const StatusChip: React.FC<{ status: Logbook['status'] }> = ({ status }) => {
  const sv = statusView(LOGBOOK_STATUS_MAP, status);
  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide ${sv.chipClass}`}>
      {sv.label}
    </span>
  );
};

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
  const [entries, setEntries] = useState<Logbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('semua');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [sheet, setSheet] = useState<null | { mode: 'add' } | { mode: 'edit'; entry: Logbook }>(null);
  const [closingSheet, setClosingSheet] = useState(false);
  const [form, setForm] = useState({ iso: '', title: '', description: '', hours: '' });
  const dateRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await logbookService.list();
      setEntries(data);
    } catch (err: any) {
      setLoadError(err?.message || 'Gagal memuat logbook.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [filter]);

  const total = entries.length;
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const approved = entries.filter(e => e.status === 'approved').length;
  const pending = entries.filter(e => e.status === 'pending').length;

  const shown = filter === 'semua' ? entries : entries.filter(e => e.status === filter);
  const visible = shown.slice(0, limit);
  const extended = limit > PAGE_SIZE;

  const openAdd = () => {
    setForm({ iso: '', title: '', description: '', hours: '' });
    setSaveError(null);
    setSheet({ mode: 'add' });
  };

  const openEdit = (entry: Logbook) => {
    setForm({
      iso: toISODate(entry.date),
      title: entry.activityTitle,
      description: entry.description,
      hours: String(entry.hours),
    });
    setSaveError(null);
    setSheet({ mode: 'edit', entry });
  };

  const closeSheet = () => {
    setClosingSheet(true);
    setTimeout(() => {
      setSheet(null);
      setClosingSheet(false);
    }, 300);
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.hours || saving) return;
    const hours = parseFloat(form.hours) || 0;
    setSaving(true);
    setSaveError(null);
    try {
      if (sheet?.mode === 'add') {
        await logbookService.create({
          title: form.title.trim(),
          description: form.description.trim(),
          hours,
          date: form.iso || undefined,
        });
      } else if (sheet?.mode === 'edit') {
        await logbookService.update(sheet.entry.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          hours,
        });
      }
      closeSheet();
      await load(); /* sinkron ulang dengan server (urutan & status terbaru) */
    } catch (err: any) {
      setSaveError(err?.message || 'Gagal menyimpan logbook.');
    } finally {
      setSaving(false);
    }
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

      {/* ═══ ERROR MUAT DATA ═══ */}
      {loadError && (
        <div className="rise-in bg-white rounded-[20px] border border-red-200 shadow-sm p-4 mt-5 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-red-600 leading-relaxed">{loadError}</p>
          </div>
          <button
            onClick={load}
            className="shrink-0 px-3 py-1.5 rounded-full bg-navy text-white text-[10px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Coba Lagi
          </button>
        </div>
      )}

      {/* ═══ 1) STATS ═══ */}
      <div className="rise-in grid grid-cols-2 gap-3 mt-5" style={{ animationDelay: '100ms' }}>
        <StatTile icon={BookOpen}     value={loading ? '–' : total}                label="Total Logbook" />
        <StatTile icon={Clock}        value={loading ? '–' : fmtHours(totalHours)} label="Total Jam" />
        <StatTile icon={CheckCircle2} value={loading ? '–' : approved}             label="Disetujui" />
        <StatTile icon={Loader2}      value={loading ? '–' : pending}              label="Pending" />
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
        {!loading && !loadError && visible.length === 0 && (
          <div className="rise-in bg-white rounded-[20px] border border-mist/60 p-8 text-center" style={{ animationDelay: '250ms' }}>
            <FileText className="w-6 h-6 text-navy/30 mx-auto" />
            <p className="text-[11px] font-bold text-navy/40 mt-2">Belum ada logbook di filter ini.</p>
          </div>
        )}

        {loading && (
          <div className="rise-in bg-white rounded-[20px] border border-mist/60 p-8 text-center" style={{ animationDelay: '250ms' }}>
            <Loader2 className="w-6 h-6 text-navy/30 mx-auto animate-spin" />
            <p className="text-[11px] font-bold text-navy/40 mt-2">Memuat logbook...</p>
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
                <span className="text-[9px] font-extrabold tabular-nums">{toISODate(e.date).slice(5).replace('-', '/')}</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-navy leading-snug">{e.activityTitle}</p>
                <p className="text-[10px] font-semibold text-navy/50 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {fmtHours(e.hours)} jam
                </p>
                {e.status === 'rejected' && e.feedback && (
                  <p className="mt-2 text-[9px] font-semibold text-navy/60 bg-shell border border-mist/60 rounded-[10px] px-2.5 py-1.5 leading-relaxed">
                    Catatan mentor: {e.feedback}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusChip status={e.status} />
                {e.status === 'rejected' && (
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

          <div className={`absolute inset-x-0 bottom-0 bg-white rounded-t-[32px] px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto ${closingSheet ? 'sheet-modal-out' : 'sheet-modal-in'}`}>
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

            {saveError && (
              <p className="mt-3 flex items-start gap-1.5 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-[10px] px-2.5 py-2 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {saveError}
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
                rows={2}
                className="w-full bg-shell border border-mist/60 rounded-[12px] px-3 py-2.5 text-xs font-semibold text-navy resize-none"
              />
            </div>

            <div className="mt-3">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">
                Deskripsi <span className="text-navy">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Jelaskan detail kegiatan yang dikerjakan..."
                rows={3}
                className="w-full bg-shell border border-mist/60 rounded-[12px] px-3 py-2.5 text-xs font-semibold text-navy resize-none"
              />
            </div>

            <div className="mt-3">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">Durasi (jam)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                placeholder="8"
                className="w-full bg-shell border border-mist/60 rounded-[12px] px-3 py-2.5 text-xs font-semibold text-navy"
              />
            </div>

            <button
              onClick={save}
              disabled={!form.title.trim() || !form.description.trim() || !form.hours || saving}
              className="mt-5 w-full bg-navy text-white rounded-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : sheet.mode === 'add' ? (
                <><Plus className="w-4 h-4" /> Kirim Logbook</>
              ) : (
                <><Pencil className="w-4 h-4" /> Simpan Perubahan</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
