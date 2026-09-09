/* ══════════════════════════════════════════════════════
   API CLIENT — satu pintu untuk semua request ke backend
   - Dev browser : BASE = '/api'          (lewat Vite proxy)
   - Build APK   : BASE = VITE_API_BASE   (URL absolut, dari secret CI / .env.apk)
   ══════════════════════════════════════════════════════ */

const BASE: string = import.meta.env.VITE_API_BASE || '/api';

/* Origin untuk file statis backend (/uploads/...) */
export const API_ORIGIN: string = BASE.replace(/\/api\/?$/, '');

/* Helper: ubah path relatif backend jadi URL absolut (untuk <img src> dll) */
export const absUrl = (path: string): string =>
  path.startsWith('http') ? path : `${API_ORIGIN}${path}`;

/* Token bisa ada di localStorage (Ingat saya) atau sessionStorage — cek keduanya,
   konsisten dengan utils/auth.ts */
const getToken = (): string | null =>
  localStorage.getItem('pkl_token') || sessionStorage.getItem('pkl_token');

interface ApiError {
  error?: string;
  message?: string;
}

/* Header wajib saat backend diakses lewat ngrok free:
   melewati halaman peringatan interstitial ("You are about to visit...")
   biar response tetap JSON, bukan HTML */
const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' } as const;

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...NGROK_HEADER,
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

  /* Upload multipart (lampiran izin) — TANPA Content-Type manual,
     biar browser/WebView yang set boundary FormData sendiri */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = { ...NGROK_HEADER };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as ApiError | null;
      throw new Error(data?.error || data?.message || 'Upload gagal');
    }
    return (await res.json()) as T;
  },
};