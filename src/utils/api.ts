/* ══════════════════════════════════════════════════════
   API CLIENT — memakai backend yang sama dengan web app
   (lewat Vite proxy: /api → backend)
   ══════════════════════════════════════════════════════ */

const BASE = '/api';

/* Token bisa ada di localStorage (Ingat saya) atau sessionStorage — cek keduanya,
   konsisten dengan utils/auth.ts */
const getToken = (): string | null =>
  localStorage.getItem('pkl_token') || sessionStorage.getItem('pkl_token');

interface ApiError {
  error?: string;
  message?: string;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(data?.error || data?.message || `Request gagal (${res.status})`);
  }
  return (await res.json()) as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: 'GET' });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE' });
  },

  /* Upload multipart (foto absensi, lampiran izin) — tanpa Content-Type manual */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as ApiError | null;
      throw new Error(data?.error || data?.message || 'Upload gagal');
    }
    return (await res.json()) as T;
  },
};
