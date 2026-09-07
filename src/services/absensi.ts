import { api } from '../utils/api';
import { localToday, toISODate } from '../utils/date';
import type { AbsensiStatus } from '../utils/statusMap';

export interface Absensi {
  id: number;
  userId: number;
  date: string; // ISO datetime (date-only di server) → slice(0,10) untuk YYYY-MM-DD
  status: AbsensiStatus;
  checkInTime: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export const absensiService = {
  /** Check-in hari ini — backend validasi geofence (403) & duplikat (409) */
  async checkIn(latitude: number, longitude: number, status: AbsensiStatus = 'hadir', date?: string): Promise<Absensi> {
    return api.post<Absensi>('/absensi', {
      status,
      latitude,
      longitude,
      date: date || localToday(),
    });
  },

  async list(): Promise<Absensi[]> {
    return api.get<Absensi[]>('/absensi');
  },

  async getToday(): Promise<Absensi | null> {
    const all = await this.list();
    const today = localToday();
    return all.find(a => toISODate(a.date) === today) || null;
  },

  async getHistory(limit: number = 7): Promise<Absensi[]> {
    const all = await this.list();
    return all.slice(0, limit);
  },
};
