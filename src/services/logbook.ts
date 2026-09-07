import { api } from '../utils/api';
import { localToday, toISODate } from '../utils/date';
import type { BackendStatus } from '../utils/statusMap';

export interface Logbook {
  id: number;
  userId: number;
  date: string; // ISO datetime → slice(0,10)
  activityTitle: string;
  description: string;
  hours: number;
  category: string | null;
  status: BackendStatus;
  feedback: string | null;
  createdAt: string;
}

export interface LogbookInput {
  title: string;
  description: string;
  hours?: number;
  category?: string;
  date?: string;
}

export const logbookService = {
  async list(): Promise<Logbook[]> {
    return api.get<Logbook[]>('/logbook');
  },

  /** Map UI field 'title' → backend field 'activity_title' (snake_case).
      hours dibulatkan ke integer — kolom Prisma bertipe Int. */
  async create(data: LogbookInput): Promise<Logbook> {
    return api.post<Logbook>('/logbook', {
      activity_title: data.title,
      description: data.description,
      hours: data.hours ? Math.round(data.hours) : 8,
      category: data.category || null,
      date: data.date || localToday(),
    });
  },

  /** Hanya untuk status 'rejected' (Revisi) — backend auto-reset ke pending */
  async update(
    id: number,
    data: { title?: string; description?: string; hours?: number; date?: string }
  ): Promise<Logbook> {
    return api.put<Logbook>(`/logbook/${id}`, {
      activity_title: data.title,
      description: data.description,
      hours: data.hours != null ? Math.round(data.hours) : undefined,
    });
  },
};

/** View model untuk UI (tanggal pendek) */
export const toEntry = (l: Logbook) => ({
  ...l,
  iso: toISODate(l.date),
});
