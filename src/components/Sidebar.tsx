import React from 'react';
import { User, SchoolProfile } from '../types';
import {
  LayoutDashboard,
  Layers,
  Users,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  BookOpenCheck,
  Building,
  RotateCcw,
  X,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  school: SchoolProfile;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  currentUser,
  school,
  onResetData,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'classes', label: 'Manajemen Kelas', icon: Layers },
    { id: 'students', label: 'Manajemen Siswa', icon: Users },
    { id: 'schedules', label: 'Jadwal Mengajar', icon: CalendarDays },
    { id: 'attendance', label: 'Presensi & Rekap', icon: CheckSquare },
    { id: 'grades', label: 'Manajemen Nilai', icon: GraduationCap },
    { id: 'journals', label: 'Jurnal Harian Guru', icon: BookOpenCheck },
    { id: 'settings', label: 'Profil & Kop Surat', icon: Building },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl md:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header Mobile Only */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 md:hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{school.name}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Modul Administrasi
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Teacher profile & Reset */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 space-y-3">
          {currentUser && (
            <div className="flex items-center gap-2.5 px-2 py-1.5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">NIP. {currentUser.nip}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onResetData}
            title="Kembalikan data contoh awal"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Data Awal SMAN 1 Gowa</span>
          </button>
        </div>
      </aside>
    </>
  );
};
