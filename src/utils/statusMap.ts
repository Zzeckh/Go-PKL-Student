/* ══════════════════════════════════════════════════════
   STATUS MAP — enum backend → label & style UI
   Backend: pending | approved | rejected (logbook & izin)
            hadir | izin | sakit | alpha   (absensi)
   ══════════════════════════════════════════════════════ */

export type BackendStatus = 'pending' | 'approved' | 'rejected';
export type AbsensiStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';

export interface StatusView {
  label: string;
  chipClass: string;
}

export const LOGBOOK_STATUS_MAP: Record<BackendStatus, StatusView> = {
  pending:  { label: 'Pending',   chipClass: 'bg-mist text-navy/60' },
  approved: { label: 'Disetujui', chipClass: 'bg-navy/10 text-navy' },
  rejected: { label: 'Revisi',    chipClass: 'bg-white border border-mist text-navy/60' },
};

export const PERMISSION_STATUS_MAP: Record<BackendStatus, StatusView> = {
  pending:  { label: 'Menunggu',  chipClass: 'bg-mist text-navy/60' },
  approved: { label: 'Disetujui', chipClass: 'bg-navy/10 text-navy' },
  rejected: { label: 'Ditolak',   chipClass: 'bg-white border border-mist text-navy/60' },
};

export const ABSENSI_STATUS_MAP: Record<AbsensiStatus, StatusView> = {
  hadir: { label: 'Hadir', chipClass: 'bg-navy/10 text-navy' },
  izin:  { label: 'Izin',  chipClass: 'bg-mist text-navy' },
  sakit: { label: 'Sakit', chipClass: 'bg-mist text-navy' },
  alpha: { label: 'Alpha', chipClass: 'bg-white border border-mist text-navy/60' },
};

/* fallback aman kalau status tak dikenal */
export const fallbackStatus: StatusView = {
  label: '—',
  chipClass: 'bg-mist text-navy/60',
};

export const statusView = (map: Record<string, StatusView>, status: string | null | undefined): StatusView =>
  (status && map[status]) || fallbackStatus;
