import React from 'react';
import { Home, MapPin, BookOpen, FileCheck, User } from 'lucide-react';

export type TabId = 'home' | 'absensi' | 'logbook' | 'izin' | 'profil';

export const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'home',    label: 'Home',    icon: Home },
  { id: 'absensi', label: 'Absensi', icon: MapPin },
  { id: 'logbook', label: 'Logbook', icon: BookOpen },
  { id: 'izin',    label: 'Izin',    icon: FileCheck },
  { id: 'profil',  label: 'Profil',  icon: User },
];

interface BottomNavProps {
  active: TabId;
  onChange: (t: TabId) => void;
  className?: string;
}

/* ══════════════════════════════════════════════════════
   BOTTOM NAV — pill navy melayang, tab aktif = pill putih
   (referensi: expanding pill navigation)
   ══════════════════════════════════════════════════════ */
export const BottomNav: React.FC<BottomNavProps> = ({ active, onChange, className }) => (
  <nav className={`fixed bottom-0 inset-x-0 z-30 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pointer-events-none ${className ?? ''}`}>
    <div className="pointer-events-auto mx-auto max-w-md bg-navy rounded-full p-2 shadow-lg shadow-navy/30 flex items-center justify-between">
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-label={tab.label}
            className={`h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isActive
                ? 'w-[120px] bg-white shadow-sm'
                : 'w-12 bg-transparent active:scale-90'
            }`}
          >
            {/* icon chip: navy saat aktif, transparan saat tidak */}
            <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-500 ${
              isActive ? 'bg-navy text-white' : 'bg-transparent text-white/40'
            }`}>
              <tab.icon className="w-5 h-5" />
            </span>

            {/* label: expand/collapse halus */}
            <span className={`text-navy text-sm font-bold whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isActive ? 'max-w-[70px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);