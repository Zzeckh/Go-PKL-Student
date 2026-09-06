import React, { useState } from 'react';
import {
  BookOpen, Clock, CheckCircle2, Loader2, Plus, Pencil, X, CalendarDays, FileText,
} from 'lucide-react';

type LogStatus = 'disetujui' | 'pending' | 'revisi';

type LogbookEntry = {
  id: number;
  iso: string;      // yyyy-mm-dd (nanti dari API)
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

/* ── format tanggal dd/mm ── */
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

/* ══════════════════════════════════════════════════════
   LOGBOOK VIEW — stats + filter + list + FAB + sheet form
   ══════════════════════════════════════════════════════ */
export const LogbookView: React.FC = () => {
  const [entries, setEntries] = useState<LogbookEntry[]>(INITIAL_LOGBOOKS);
  const [filter, setFilter] = useState<Filter>('semua');

  /* sheet form: add / edit */
  const [sheet, setSheet] = useState<null | { mode: 'add' } | { mode: 'edit'; entry: LogbookEntry }>(null);
  const [closingSheet, setClosingSheet] = useState(false);
  const [form, setForm] = useState({ iso: '', title: '', hours: '' });

  /* ── stats ── */
  const total = entries.length;
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const approved = entries.filter(e => e.status === 'disetujui').length;
  const pending = entries.filter(e => e.status === 'pending').length;
  const revisiCount = entries.filter(e => e.status === 'revisi').length;

  const shown = filter === 'semua' ? entries : entries.filter(e => e.status === filter);

  /* ── buka/tutup sheet ── */
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

  /* ── simpan (nanti POST/PUT ke API) ── */
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

  return (
    <div className="relative">
      {/* ═══ HEADER ═══ */}
      <div className="fall-in flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold text-navy/50 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" /> Laporan kegiatan magang
          </p>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight mt-1">Logbook</h1>
        </div>
        {revisiCount > 0 && (
          <button
            onClick={() => setFilter('revisi')}
            className="px-2.5 py-1 rounded-full bg-navy text-white text-[9px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Pencil className="w-3 h-3" /> {revisiCount} revisi
          </button>
        )}
      </div>

      {/* ═══ 1) CARD STATS (4 metrik) ═══ */}
      <div className="fall-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4 mt-5" style={{ animationDelay: '100ms' }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-navy text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-navy tabular-nums leading-tight">{total}</p>
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Total Logbook</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-navy/10 text-navy flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-navy tabular-nums leading-tight">{fmtHours(totalHours)}</p>
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Total Jam</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-navy/10 text-navy flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-navy tabular-nums leading-tight">{approved}</p>
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Disetujui</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-mist text-navy/60 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-navy tabular-nums leading-tight">{pending}</p>
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 2) FILTER CHIPS ═══ */}
      <div className="fall-in flex gap-2 mt-4 overflow-x-auto" style={{ animationDelay: '200ms' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-extrabold transition-all active:scale-95 ${
              filter === f.id
                ? 'bg-navy text-white shadow-md shadow-navy/25'
                : 'bg-white text-navy/60 border border-mist/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ═══ 3) LIST LOGBOOK (re-stagger saat filter ganti) ═══ */}
      <div key={filter} className="flex flex-col gap-3 mt-4">
        {shown.length === 0 && (
          <div className="fall-in bg-white rounded-[20px] border border-mist/60 p-8 text-center" style={{ animationDelay: '250ms' }}>
            <FileText className="w-6 h-6 text-navy/30 mx-auto" />
            <p className="text-[11px] font-bold text-navy/40 mt-2">Belum ada logbook di filter ini.</p>
          </div>
        )}

        {shown.map((e, i) => (
          <div
            key={e.id}
            className="fall-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4"
            style={{ animationDelay: `${250 + i * 70}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-shell border border-mist/60 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-extrabold text-navy tabular-nums">{fmtDM(e.iso)}</span>
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
      </div>

      {/* ═══ FAB TAMBAH LOGBOOK ═══ */}
      <button
        onClick={openAdd}
        aria-label="Tambah logbook"
        className="fall-in fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-navy text-white shadow-lg shadow-navy/30 flex items-center justify-center active:scale-90 transition-all"
        style={{ animationDelay: '400ms' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ═══ BOTTOM-SHEET FORM (add / edit) ═══ */}
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

            {/* tanggal */}
            <div className="mt-4">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">Tanggal</label>
              <input
                type="date"
                value={form.iso}
                onChange={e => setForm(f => ({ ...f, iso: e.target.value }))}
                className="w-full bg-shell border border-mist/60 rounded-[12px] px-3 py-2.5 text-xs font-semibold text-navy"
              />
            </div>

            {/* kegiatan */}
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

            {/* jam */}
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