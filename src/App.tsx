import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { readUser, clearAuth, saveUser, getToken } from './utils/auth.ts';
import { authService } from './services/auth.ts';

export default function App() {
  const [user, setUser] = useState<any>(() => readUser());
  /* in-memory: TRUE hanya setelah klik logout di sesi ini.
     Refresh halaman → state ini hilang → splash main lagi. */
  const [loggedOut, setLoggedOut] = useState(false);

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
    setLoggedOut(true);
  };

  const handleSuccess = (u: any) => {
    setUser(u);
    setLoggedOut(false);
  };

  if (!user) {
    return <LoginScreen skipIntro={loggedOut} onSuccess={handleSuccess} />;
  }

  return <StudentDashboard user={user} onLogout={handleLogout} />;
}
