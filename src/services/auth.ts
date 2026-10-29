import { api } from '../utils/api';
import { setToken, saveUser, getToken, readUser } from '../utils/auth';

export interface CompanyLocation {
  lat: number;
  lng: number;
  radius: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  whatsapp: string | null;
  nis: string | null;
  gender: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  nisn: string | null;
  nik: string | null;
  religion: string | null;
  concentration: string | null;
  address: string | null;
  parentName: string | null;
  parentAddress: string | null;
  parentPhone: string | null;
  schoolName: string;
  schoolAddress: string;
  teacherNip: string | null;
  role: string;
  companyName: string | null;
  companyAddress: string | null;
  companyLocation: CompanyLocation | null;
  teacherName: string | null;
  className: string | null;
  major: string | null;
  academicYear: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string, remember: boolean): Promise<User> {
    const { token, user } = await api.post<LoginResponse>('/auth/login', { email, password });
    setToken(token, remember);
    saveUser(user, remember);
    return user;
  },

  async getMe(): Promise<User | null> {
    const token = getToken();
    if (!token) return null;
    try {
      return await api.get<User>('/auth/me');
    } catch {
      return null;
    }
  },

  getCurrentUser(): User | null {
    return readUser();
  },
};
