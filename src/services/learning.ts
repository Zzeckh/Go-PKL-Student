import { api } from '../utils/api';

/* ══════════════════════════════════════════════════════
   LEARNING SERVICE — Capaian & Tujuan Pembelajaran.
   Endpoint ini hanya dibaca (GET) di aplikasi siswa; data
   dikelola mentor/sekolah lewat aplikasi web.
   ══════════════════════════════════════════════════════ */

export interface LearningStudent {
  id: number;
  name: string;
  className: string | null;
  companyName: string | null;
}

export interface SignedBy {
  id: number;
  name: string;
}

export interface Achievement {
  id: number;
  orderIndex: number;
  title: string;
  evidence: string | null;
  weeks: number[];
  mentorSignedAt: string | null;
  mentorSignedBy: SignedBy | null;
  teacherSignedAt: string | null;
  teacherSignedBy: SignedBy | null;
}

export interface LearningGoal {
  id: number;
  orderIndex: number;
  title: string;
  score: number | null;
  description: string | null;
}

export interface LearningAccess {
  canView: boolean;
  canManageAchievements: boolean;
  canSignMentor: boolean;
  canSignTeacher: boolean;
  canEditGoals: boolean;
}

export interface AchievementsPayload {
  student: LearningStudent;
  achievements: Achievement[];
  access: LearningAccess;
}

export interface GoalsPayload {
  student: LearningStudent;
  goals: LearningGoal[];
  access: LearningAccess;
}

export const learningService = {
  /** GET /learning/students/:id/achievements — read-only untuk siswa */
  getAchievements(studentId: number): Promise<AchievementsPayload> {
    return api.get<AchievementsPayload>(`/learning/students/${studentId}/achievements`);
  },

  /** GET /learning/students/:id/goals — read-only untuk siswa */
  getGoals(studentId: number): Promise<GoalsPayload> {
    return api.get<GoalsPayload>(`/learning/students/${studentId}/goals`);
  },
};

export const formatSignatureDate = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
