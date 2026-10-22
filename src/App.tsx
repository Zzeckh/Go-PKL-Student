import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { readUser, clearAuth, saveUser, getToken, isRememberToken } from './utils/auth.ts';
import { authService } from './services/auth.ts';
import { SplashScreen } from './components/SplashScreen.tsx';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  /* State awal: user hanya dianggap login kalau tokennya ikut ada.
     Mencegah dashboard sempat render (dan menembak request 401) sebelum
     efek verifikasi di bawah sempat berjalan. */
  const [user, setUser] = useState<any>(() => (getToken() ? readUser() : null));

  /* ── Auto-login: kalau ada token, verifikasi via /api/auth/me ──
     Sukses → refresh data user (nama, kelas, companyLocation bisa berubah).
     Gagal (token expired/invalid) → clearAuth → kembali ke login. */
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
    authService.getMe().then(u => {
      if (u) {
        if (!readUser()) saveUser(u, isRememberToken());
        setUser(u);
      } else {
        clearAuth();
        setUser(null);
      }
    });
  }, []);

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

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (!user) {
    return <LoginScreen onSuccess={handleSuccess} />;
  }

  return <StudentDashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
}
