import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, HeartPulse, Loader2, CheckCircle2, XCircle, Plus, X, CalendarDays,
  ChevronDown, ImagePlus, Trash2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { TopoPattern } from './Decor';
import { permissionService, type Permission, type PermissionType } from '../services/permission';
import { PERMISSION_STATUS_MAP, statusView } from '../utils/statusMap';
import { fmtDM } from '../utils/date';

type Filter = 'semua' | 'pending' | 'approved' | 'rejected';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'semua',    label: 'Semua' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'pending',  label: 'Menunggu' },
  { id: 'rejected', label: 'Ditolak' },
];

const PAGE_SIZE = 3;
const MAX_IMG = 1024 * 1024; // 1 MB (UI) — backend membolehkan 5 MB

const fmtKB = (b: number) => `${Math.max(1, Math.round(b / 1024))} KB`;

const TypeIcon: React.FC<{ type: PermissionType; className?: string }> = ({ type, className }) =>
  type === 'sakit' ? <HeartPulse className={className} /> : <FileText className={className} />;

const StatusChip: React.FC<{ status: Permission['status'] }> = ({ status }) => {
  const sv = statusView(PERMISSION_STATUS_MAP, status);
  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide ${sv.chipClass}`}>
      {sv.label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════
   PERIZINAN VIEW — hero fluid + sheet overlap (ala Absensi)
   ══════════════════════════════════════════════════════ */
export const IzinView: React.FC = () => {
  const [entries, setEntries] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('semua');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [sheet, setSheet] = useState(false);
  const [closingSheet, setClosingSheet] = useState(false);
  const [type, setType] = useState<PermissionType>('izin');
  const [iso, setIso] = useState('');
  const [reason, setReason] = useState('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [image, setImage] = useState<null | { name: string; size: number; dataUrl: string }>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const dateRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await permissionService.list();
      setEntries(data);
    } catch (err: any) {
      setLoadError(err?.message || 'Gagal memuat pengajuan izin.');
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
  const countApproved = entries.filter(e => e.status === 'approved').length;
  const countPending = entries.filter(e => e.status === 'pending').length;
  const countRejected = entries.filter(e => e.status === 'rejected').length;

  const shown = filter === 'semua' ? entries : entries.filter(e => e.status === filter);
  const visible = shown.slice(0, limit);
  const extended = limit > PAGE_SIZE;

  const openSheet = () => {
    setType('izin');
    setIso('');
    setReason('');
    setFileObj(null);
    setImage(null);
    setFileError(null);
    setSaveError(null);
    setSheet(true);
  };

  const closeSheet = () => {
    setClosingSheet(true);
    setTimeout(() => {
      setSheet(false);
      setClosingSheet(false);
    }, 300);
  };

  /* upload gambar: WAJIB, maks 1 MB (UI) */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;

    if (!f.type.startsWith('image/')) {
      setFileError('File harus berupa gambar (JPG/PNG/WEBP).');
      setFileObj(null);
      setImage(null);
      return;
    }
    if (f.size > MAX_IMG) {
      setFileError(`Ukuran gambar ${fmtKB(f.size)} — maksimal 1 MB.`);
      setFileObj(null);
      setImage(null);
      return;
    }

    setFileError(null);
    setFileObj(f);
    const reader = new FileReader();
    reader.onload = () =>
      setImage({ name: f.name, size: f.size, dataUrl: String(reader.result) });
    reader.readAsDataURL(f);
  };

  const canSubmit = !!iso && !!reason.trim() && !!fileObj && !saving;

  const save = async () => {
    if (!canSubmit || !fileObj) return;
    setSaving(true);
    setSaveError(null);
    try {
      await permissionService.create({
        type,
        reason: reason.trim(),
        date: iso,
        file: fileObj,
      });
      closeSheet();
      await load(); /* sinkron ulang dengan server */
    } catch (err: any) {
      setSaveError(err?.message || 'Gagal mengirim pengajuan.');
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
      {/* ═══ HERO NAVY FLUID — full bleed ═══ */}
      <div className="rise-in relative -mx-5 -mt-6 bg-navy px-5 pt-6 pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <TopoPattern />
        </div>

        <div className="relative">
          {/* judul + total */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/60 text-[10px] font-semibold flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" /> Pengajuan izin & sakit
              </p>
              <h1 className="text-white text-3xl font-extrabold tracking-tight mt-1">Perizinan</h1>
            </div>
            <div className="text-right">
              <p className="text-white text-3xl font-extrabold tabular-nums leading-none">{loading ? '–' : total}</p>
              <p className="text-white/60 text-[10px] font-bold mt-1">pengajuan</p>
            </div>
          </div>

          {/* 3 chip kaca — klik = filter */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <button
              onClick={() => setFilter(filter === 'approved' ? 'semua' : 'approved')}
              className={`rounded-[14px] border p-2.5 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                filter === 'approved' ? 'bg-white text-navy border-white shadow-md' : 'bg-white/10 border-white/15 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-extrabold tabular-nums leading-none">{loading ? '–' : countApproved}</span>
              <span className={`text-[8px] font-bold uppercase tracking-wide ${filter === 'approved' ? 'text-navy/60' : 'text-white/60'}`}>Disetujui</span>
            </button>

            <button
              onClick={() => setFilter(filter === 'pending' ? 'semua' : 'pending')}
              className={`rounded-[14px] border p-2.5 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                filter === 'pending' ? 'bg-white text-navy border-white shadow-md' : 'bg-white/10 border-white/15 text-white'
              }`}
            >
              <Loader2 className="w-4 h-4" />
              <span className="text-sm font-extrabold tabular-nums leading-none">{loading ? '–' : countPending}</span>
              <span className={`text-[8px] font-bold uppercase tracking-wide ${filter === 'pending' ? 'text-navy/60' : 'text-white/60'}`}>Menunggu</span>
            </button>

            <button
              onClick={() => setFilter(filter === 'rejected' ? 'semua' : 'rejected')}
              className={`rounded-[14px] border p-2.5 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                filter === 'rejected' ? 'bg-white text-navy border-white shadow-md' : 'bg-white/10 border-white/15 text-white'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-extrabold tabular-nums leading-none">{loading ? '–' : countRejected}</span>
              <span className={`text-[8px] font-bold uppercase tracking-wide ${filter === 'rejected' ? 'text-navy/60' : 'text-white/60'}`}>Ditolak</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ WHITE SHEET overlap ═══ */}
      <div className="relative -mx-5 -mt-8 bg-white rounded-t-[32px] px-5 pt-6 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        {/* filter chips */}
        <div className="rise-in grid grid-cols-4 gap-2" style={{ animationDelay: '100ms' }}>
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

        {/* error muat data */}
        {loadError && (
          <div className="rise-in bg-white rounded-[20px] border border-red-200 shadow-sm p-4 mt-4 flex items-center justify-between gap-3">
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

        {/* list pengajuan */}
        <div key={filter} className="flex flex-col gap-3 mt-4">
          {!loading && !loadError && visible.length === 0 && (
            <div className="rise-in bg-white rounded-[20px] border border-mist/60 p-8 text-center" style={{ animationDelay: '250ms' }}>
              <FileText className="w-6 h-6 text-navy/30 mx-auto" />
              <p className="text-[11px] font-bold text-navy/40 mt-2">Belum ada pengajuan di filter ini.</p>
            </div>
          )}

          {loading && (
            <div className="rise-in bg-white rounded-[20px] border border-mist/60 p-8 text-center" style={{ animationDelay: '250ms' }}>
              <Loader2 className="w-6 h-6 text-navy/30 mx-auto animate-spin" />
              <p className="text-[11px] font-bold text-navy/40 mt-2">Memuat pengajuan...</p>
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
                  <TypeIcon type={e.type} className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-navy leading-snug">
                    {e.type === 'sakit' ? 'Sakit' : 'Izin'} · {fmtDM(e.date)}
                  </p>
                  <p className="text-[10px] font-semibold text-navy/50 mt-1 leading-relaxed">{e.reason}</p>
                  {e.status === 'rejected' && e.rejectReason && (
                    <p className="mt-2 text-[9px] font-semibold text-navy/60 bg-shell border border-mist/60 rounded-[10px] px-2.5 py-1.5 leading-relaxed">
                      Alasan ditolak: {e.rejectReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusChip status={e.status} />
                  {e.status === 'pending' && (
                    <span className="flex items-center gap-1 text-[8px] font-bold text-navy/40">
                      <Loader2 className="w-3 h-3 animate-spin" /> direview
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* show more */}
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
      </div>

      {/* ═══ FAB AJUKAN ═══ */}
      <button
        onClick={openSheet}
        aria-label="Ajukan izin"
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
              <p className="text-sm font-extrabold text-navy">Ajukan Perizinan</p>
              <button onClick={closeSheet} aria-label="Tutup" className="w-8 h-8 rounded-full bg-shell border border-mist/60 text-navy/60 flex items-center justify-center active:scale-90 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* pilihan tipe */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setType('izin')}
                className={`rounded-[16px] py-3.5 flex flex-col items-center gap-1.5 border transition-all active:scale-[0.97] ${
                  type === 'izin'
                    ? 'bg-navy text-white border-navy shadow-md shadow-navy/25'
                    : 'bg-white text-navy/50 border-mist/60'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">Izin</span>
              </button>

              <button
                onClick={() => setType('sakit')}
                className={`rounded-[16px] py-3.5 flex flex-col items-center gap-1.5 border transition-all active:scale-[0.97] ${
                  type === 'sakit'
                    ? 'bg-navy text-white border-navy shadow-md shadow-navy/25'
                    : 'bg-white text-navy/50 border-mist/60'
                }`}
              >
                <HeartPulse className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">Sakit</span>
              </button>
            </div>

            {/* tanggal */}
            <div className="mt-4">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">Tanggal</label>
              <div className="relative">
                <input
                  ref={dateRef}
                  type="date"
                  value={iso}
                  onChange={e => setIso(e.target.value)}
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

            {/* alasan */}
            <div className="mt-3">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">Alasan / Keterangan</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={type === 'sakit' ? 'Contoh: Demam tinggi, disarankan istirahat 2 hari...' : 'Contoh: Acara pernikahan kakak di luar kota...'}
                rows={3}
                className="w-full bg-shell border border-mist/60 rounded-[12px] px-3 py-2.5 text-xs font-semibold text-navy resize-none"
              />
            </div>

            {/* upload gambar wajib */}
            <div className="mt-3">
              <label className="text-[10px] font-bold text-navy/60 uppercase tracking-wide block mb-1">
                Bukti Gambar <span className="text-navy">*</span>
              </label>

              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

              {image ? (
                <div className="flex items-center gap-3 bg-shell border border-mist/60 rounded-[16px] p-3">
                  <img src={image.dataUrl} alt="Bukti" className="w-14 h-14 rounded-[12px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-navy truncate">{image.name}</p>
                    <p className="text-[9px] font-semibold text-navy/50 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {fmtKB(image.size)} · valid
                    </p>
                  </div>
                  <button
                    onClick={() => { setImage(null); setFileObj(null); setFileError(null); }}
                    aria-label="Hapus gambar"
                    className="w-8 h-8 rounded-full bg-white border border-mist/60 text-navy/60 flex items-center justify-center active:scale-90 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-[16px] border-2 border-dashed border-mist bg-shell py-5 flex flex-col items-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <ImagePlus className="w-5 h-5 text-navy/50" />
                  <span className="text-[10px] font-extrabold text-navy/60">Upload bukti (wajib)</span>
                  <span className="text-[9px] font-semibold text-navy/40">JPG/PNG/WEBP · maksimal 1 MB</span>
                </button>
              )}

              {fileError && (
                <p className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-navy bg-mist/60 rounded-[10px] px-2.5 py-1.5">
                  <XCircle className="w-3 h-3" /> {fileError}
                </p>
              )}
            </div>

            {/* error dari backend */}
            {saveError && (
              <p className="mt-3 flex items-start gap-1.5 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-[10px] px-2.5 py-2 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {saveError}
              </p>
            )}

            <button
              onClick={save}
              disabled={!canSubmit}
              className="mt-5 w-full bg-navy text-white rounded-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
              ) : (
                <><Plus className="w-4 h-4" /> Kirim Pengajuan</>
              )}
            </button>

            {!image && (
              <p className="mt-2 text-center text-[9px] font-semibold text-navy/40">
                Gambar bukti wajib dilampirkan untuk mengirim pengajuan.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
