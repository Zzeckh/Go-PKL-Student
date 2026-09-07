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
};
