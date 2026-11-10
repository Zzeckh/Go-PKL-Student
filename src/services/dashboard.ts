import { logbookService } from './logbook';
import { absensiService } from './absensi';
import { permissionService } from './permission';
import { localToday, toISODate, fmtDM } from '../utils/date';

export interface DashboardStats {
  totalLogbook: number;
  totalHours: number;
  approvedCount: number;
  pendingCount: number;
  attendanceCount: number;
  revisiCount: number;
  izinPendingCount: number;
  /** agregat 7 hari terakhir untuk chart di HomeView */
  weekChart: { label: string; count: number; today: boolean }[];
}

export interface DashboardNotification {
  id: string;
  type: 'logbook' | 'izin';
  tone: 'ok' | 'warn';
  title: string;
  sub: string;
  time: string;
  createdAt: string;
}

const relativeTime = (value: string) => {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} mnt`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari`;
  return `${Math.floor(days / 7)} mgg`;
};

export const dashboardService = {
  /* Backend belum punya endpoint stats khusus siswa → hitung dari data mentah */
  async getStats(): Promise<DashboardStats> {
    const [logbooks, absensis, permissions] = await Promise.all([
      logbookService.list(),
      absensiService.list(),
      permissionService.list(),
    ]);

    const totalLogbook = logbooks.length;
    const totalHours = logbooks.reduce((sum, l) => sum + l.hours, 0);
    const approvedCount = logbooks.filter(l => l.status === 'approved').length;
    const pendingCount = logbooks.filter(l => l.status === 'pending').length;
    const revisiCount = logbooks.filter(l => l.status === 'rejected').length;
    const attendanceCount = absensis.filter(a => a.status === 'hadir').length;
    const izinPendingCount = permissions.filter(p => p.status === 'pending').length;

    const today = localToday();
    const weekChart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = logbooks.filter(l => toISODate(l.date) === iso).length;
      return { label: fmtDM(iso), count, today: iso === today };
    });

    return {
      totalLogbook,
      totalHours,
      approvedCount,
      pendingCount,
      attendanceCount,
      revisiCount,
      izinPendingCount,
      weekChart,
    };
  },

  async getNotifications(): Promise<DashboardNotification[]> {
    const [logbooks, permissions] = await Promise.all([
      logbookService.list(),
      permissionService.list(),
    ]);

    const logbookNotifications = logbooks
      .filter((entry) => entry.status !== 'pending')
      .map((entry) => ({
        id: `logbook-${entry.id}`,
        type: 'logbook' as const,
        tone: entry.status === 'rejected' ? 'warn' as const : 'ok' as const,
        title: entry.status === 'rejected' ? 'Jurnal perlu revisi' : 'Jurnal disetujui',
        sub: `${entry.activityTitle} · ${fmtDM(entry.date)}`,
        time: relativeTime(entry.createdAt),
        createdAt: entry.createdAt,
      }));

    const permissionNotifications = permissions
      .filter((entry) => entry.status !== 'pending')
      .map((entry) => ({
        id: `izin-${entry.id}`,
        type: 'izin' as const,
        tone: entry.status === 'rejected' ? 'warn' as const : 'ok' as const,
        title: entry.status === 'rejected' ? 'Izin ditolak' : 'Izin diterima',
        sub: `${entry.type === 'sakit' ? 'Sakit' : 'Keperluan'} · ${fmtDM(entry.date)}`,
        time: relativeTime(entry.createdAt),
        createdAt: entry.createdAt,
      }));

    return [...logbookNotifications, ...permissionNotifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  },
};
