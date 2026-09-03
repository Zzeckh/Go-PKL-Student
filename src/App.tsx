import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { readUser, clearAuth } from './utils/auth.ts';

export default function App() {
  const [user, setUser] = useState<any>(() => readUser());

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  if (!user) return <LoginScreen onSuccess={setUser} />;

  return <StudentDashboard user={user} onLogout={handleLogout} />;
}