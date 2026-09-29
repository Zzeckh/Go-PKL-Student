/* ✅ Key token SAMA dengan aplikasi web & api.ts */
export const TOKEN_KEY = 'pkl_token';
export const USER_KEY = 'gopkl_user';

/* ── Flag onboarding ──
   Disimpan SEPARAH dari auth agar TIDAK terhapus saat logout.
   Tujuannya: setelah login pertama kali, logout berikutnya
   skip splash + loading, langsung landing di form login. */
const ONBOARD_KEY = 'gopkl_onboarded';

export const getToken = (): string | null =>
  sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);

/* Store tujuan & store lawan.
   Salaman di store SATUNYA selalu dihapus, supaya `pkl_token` dan `gopkl_user`
   tidak pernah terpisah antar store (dulu: user bisa tersisa di localStorage
   sedangkan token hanya di sessionStorage → dashboard hidup tanpa token →
   semua request 401 "Token tidak ditemukan."). */
const storeOf = (remember: boolean) => (remember ? localStorage : sessionStorage);
const otherStoreOf = (remember: boolean) => (remember ? sessionStorage : localStorage);

/* true = token disimpan di localStorage ("Ingat saya"), false = sessionStorage */
export const isRememberToken = (): boolean => localStorage.getItem(TOKEN_KEY) !== null;

export const setToken = (token: string, remember: boolean) => {
  storeOf(remember).setItem(TOKEN_KEY, token);
  otherStoreOf(remember).removeItem(TOKEN_KEY);
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  /* ⚠️ ONBOARD_KEY TIDAK dihapus di sini — logout tidak mereset onboarding.
     Untuk memaksa splash muncul lagi (misal reset pengalaman), hapus manual:
     localStorage.removeItem(ONBOARD_KEY); */
};

export const readUser = (): any => {
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveUser = (user: any, remember: boolean) => {
  storeOf(remember).setItem(USER_KEY, JSON.stringify(user));
  otherStoreOf(remember).removeItem(USER_KEY);
};

/* ── Onboarding flag: tandai bahwa user sudah pernah login sekali ── */
export const setOnboardingDone = () => {
  try {
    localStorage.setItem(ONBOARD_KEY, '1');
  } catch {
    /* silent */
  }
};

export const isOnboardingDone = (): boolean => {
  try {
    return localStorage.getItem(ONBOARD_KEY) === '1';
  } catch {
    return false;
  }
};