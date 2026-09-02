import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { readUser, clearAuth } from './utils/auth.ts';

export default function App() {
  const [user, setUser] = useState<any>(() => readUser());

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  if (!user) return <LoginScreen onSuccess={setUser} />;

  /* Placeholder home — bottom nav menyusul */
  return (
    <div className="min-h-screen bg-shell flex items-center justify-center p-6">
      <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-6 text-center w-full max-w-sm">
        <p className="text-lg font-extrabold text-navy">Halo, {user?.name || 'Siswa'}!</p>
        <p className="text-sm text-navy/60 mt-1 font-semibold">
          Login berhasil. Halaman home & bottom nav menyusul.
        </p>
        <button
          onClick={handleLogout}
          className="mt-5 w-full bg-navy text-white rounded-[16px] py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-navy/20"
        >
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>
    </div>
  );
}