/* ══════════════════════════════════════════════════════
   DATE HELPERS — backend simpan date sebagai DateTime
   (JSON: "2026-02-16T00:00:00.000Z"), UI pakai YYYY-MM-DD.
   Pakai waktu LOKAL (bukan UTC) supaya konsisten dengan
   server yang pakai tanggal lokal juga.
   ══════════════════════════════════════════════════════ */

/** Tanggal hari ini (zona lokal) sebagai YYYY-MM-DD */
export const localToday = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Ambil bagian YYYY-MM-DD dari nilai tanggal apa pun (ISO penuh / sudah pendek) */
export const toISODate = (v: string | null | undefined): string =>
  (v ? v.slice(0, 10) : '');

/** Format jam HH:MM dari ISO datetime, null kalau tidak ada/invalid */
export const fmtTimeID = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
};

/** Label dd/MM dari YYYY-MM-DD (atau ISO penuh) */
export const fmtDM = (iso: string): string => {
  const short = toISODate(iso);
  const [, m, d] = short.split('-');
  return m && d ? `${d}/${m}` : short;
};
