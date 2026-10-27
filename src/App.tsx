import { useState, useEffect, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { readUser, clearAuth, saveUser, getToken, isRememberToken } from './utils/auth.ts';
import { authService } from './services/auth.ts';
import { SplashScreen } from './components/SplashScreen.tsx';

/* Minimal durasi splash supaya seluruh animasi masuk sempat tampil,
   walaupun verifikasi token sudah selesai lebih dulu. */
const SPLASH_MIN_MS = 1500;
/* Jangan biarkan splash menggantung kalau jaringan lambat. */
const AUTH_MAX_MS = 5000;

export default function App() {
  /* Splash hanya untuk cold start. Setelah login/logout di sesi yang sama
     nilainya tetap false, jadi tidak ada splash lagi. */
  const [booting, setBooting] = useState(true);
  const [minDone, setMinDone] = useState(false);
  const [authChecked, setAuthChecked] = useState(() => !getToken());

  /* State awal: user hanya dianggap login kalau tokennya ikut ada.
     Mencegah dashboard sempat render (dan menembak request 401) sebelum
     efek verifikasi di bawah sempat berjalan. */
  const [user, setUser] = useState<any>(() => (getToken() ? readUser() : null));

  /* Timer durasi minimum splash (jalan paralel dengan verifikasi token). */
  useEffect(() => {
    const t = window.setTimeout(() => setMinDone(true), SPLASH_MIN_MS);
    return () => window.clearTimeout(t);
  }, []);

  /* ── Auto-login: kalau ada token, verifikasi via /api/auth/me ──
     Sukses → refresh data user (nama, kelas, companyLocation bisa berubah).
     Gagal (token expired/invalid) → clearAuth → kembali ke layar login. */
  useEffect(() => {
    const token = getToken();
    if (!token) {
      /* Token hilang tapi data user lama masih tersimpan → JANGAN biarkan
         dashboard tampil tanpa token (semua request pasti 401
         "Token tidak ditemukan"). Bersihkan, kembali ke layar login. */
      if (readUser()) {
        clearAuth();
        setUser(null);
      }
      return;
    }

    let alive = true;
    /* Batas waktu: kalau backend tidak merespons, tetap lanjut ke layar
       login daripada splash menggantung selamanya. */
    const cap = window.setTimeout(() => {
      if (alive) setAuthChecked(true);
    }, AUTH_MAX_MS);

    authService.getMe().then(u => {
      if (!alive) return;
      if (u) {
        if (!readUser()) saveUser(u, isRememberToken());
        setUser(u);
      } else {
        clearAuth();
        setUser(null);
      }
    }).finally(() => {
      if (!alive) return;
      window.clearTimeout(cap);
      setAuthChecked(true);
    });

    return () => {
      alive = false;
      window.clearTimeout(cap);
    };
  }, []);

  const finishSplash = useCallback(() => setBooting(false), []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  /* ── Update data user di context (mis. setelah edit email/whatsapp di profil) ──
     Persist ke storage yang sama dengan lokasi token (remember / session). */
  const handleUserUpdate = (u: any) => {
    setUser(u);
    /* Simpan user di store yang SAMA dengan tempat token.
       Kalau token sudah tidak ada, jangan tulis apa pun — agar tidak tercipta
       `gopkl_user` tanpa `pkl_token` (penyebab 401 "Token tidak ditemukan"). */
    if (!getToken()) return;
    saveUser(u, isRememberToken());
  };

  const handleSuccess = (u: any) => {
    setUser(u);
  };

  /* Layar tujuan dirender sejak awal di bawah splash. Dengan begitu saat
     splash menyusut/ memudar, layar di baliknya sudah siap — tidak ada
     kedipan putih atau form yang baru muncul belakangan. */
  const destination = !user
    ? <LoginScreen onSuccess={handleSuccess} intro={!booting} />
    : <StudentDashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;

  return (
    <>
      {destination}
      {booting && (
        <SplashScreen
          ready={minDone && authChecked}
          mode={user ? 'app' : 'login'}
          onDone={finishSplash}
        />
      )}
    </>
  );
}
