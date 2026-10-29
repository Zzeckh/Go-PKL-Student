import { api } from '../utils/api';
import type { User } from './auth';

export interface UpdateProfilePayload {
  email?: string;
  whatsapp?: string;
  gender?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  concentration?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentAddress?: string | null;
  parentPhone?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export const profileService = {
  /** PUT /auth/profile — edit email / WhatsApp milik sendiri, balik objek User terbaru */
  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return api.put<User>('/auth/profile', payload);
  },

  /** PUT /auth/password — ganti password sendiri (verifikasi password saat ini) */
  changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
    return api.put<MessageResponse>('/auth/password', payload);
  },

  /** GET /auth/me — refetch profil terbaru setelah save */
  getMe(): Promise<User> {
    return api.get<User>('/auth/me');
  },
};
