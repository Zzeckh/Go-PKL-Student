export type ActivePage = 
  | 'dashboard' 
  | 'logbook' 
  | 'maps' 
  | 'profile' 
  | 'settings'
  | 'absensi' 
  | 'attendance' 
  | 'roster' 
  | 'monitoring' 
  | 'perizinan' 
  | 'rekap' 
  | 'data-siswa' 
  | 'data-pembimbing' 
  | 'pemetaan' 
  | 'data'
  | 'super-classes'
  | 'super-users'
  | 'super-companies'
  | 'laporan';

export type AuthMode = 'login' | 'register';
export type UserRole = 'intern' | 'mentor' | 'teacher' | 'hubin' | 'super_admin'; // ← TAMBAH super_admin

export interface LogEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  hours: number;
  category: string;
  status: 'approved' | 'pending' | 'revision';
  feedback?: string;
  attachmentName?: string;
  userId?: number;
  userName?: string;
  userClass?: string;
}

export interface PKLMapLocation {
  id: string;
  companyName: string;
  address: string;
  category: string;
  internsCount: number;
  mentorName: string;
  coordinates: { x: number; y: number };
  distance: string;
  status: 'active' | 'geofenced';
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  userId?: number;
}

export interface ActivityRecord {
  id: string;
  date: string;
  time: string;
  type: 'attendance' | 'journal';
  statusLabel: string;
  approvalStatus?: 'approved' | 'pending' | 'revision';
}
