import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { readUser, clearAuth, saveUser, getToken } from './utils/auth.ts';
import { authService } from './services/auth.ts';

export default function App() {
  const [user, setUser] = useState<any>(() => readUser());

  /* ── Auto-login: kalau ada token, verifikasi via /api/auth/me ──
     Sukses → refresh data user (nama, kelas, companyLocation bisa berubah).
     Gagal (token expired/invalid) → clearAuth → kembali ke login. */
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    authService.getMe().then(u => {
      if (u) {
        if (!readUser()) saveUser(u, true);
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
    const remember = localStorage.getItem('pkl_token') !== null;
    saveUser(u, remember);
  };

  const handleSuccess = (u: any) => {
    setUser(u);
  };

  if (!user) {
    return <LoginScreen onSuccess={handleSuccess} />;
  }

  return <StudentDashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
}
