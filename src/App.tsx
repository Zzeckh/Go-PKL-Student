import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { readUser, clearAuth } from './utils/auth.ts';

export default function App() {
  const [user, setUser] = useState<any>(() => readUser());
  /* in-memory: TRUE hanya setelah klik logout di sesi ini.
     Refresh halaman → state ini hilang → splash main lagi. */
  const [loggedOut, setLoggedOut] = useState(false);

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