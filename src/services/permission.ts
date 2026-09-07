import { api } from '../utils/api';
import { toISODate } from '../utils/date';
import type { BackendStatus } from '../utils/statusMap';

export type PermissionType = 'sakit' | 'izin';

export interface Permission {
  id: number;
  userId: number;
  type: PermissionType;
  reason: string;
  attachmentUrl: string | null;
  date: string; // ISO datetime → slice(0,10)
  status: BackendStatus;
  rejectReason: string | null;
  createdAt: string;
}

export const permissionService = {
  async list(): Promise<Permission[]> {
    return api.get<Permission[]>('/permissions');
  },

  /** multipart/form-data — field file WAJIB bernama 'file' (backend multer) */
  async create(data: {
    type: PermissionType;
    reason: string;
    date: string;
    file: File;
  }): Promise<Permission> {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('reason', data.reason);
    formData.append('date', data.date);
    formData.append('file', data.file);
    return api.upload<Permission>('/permissions', formData);
  },
};

/** View model untuk UI (tanggal pendek) */
export const toEntry = (p: Permission) => ({
  ...p,
  iso: toISODate(p.date),
});
