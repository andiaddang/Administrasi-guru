import React from 'react';
import { User, SchoolProfile, AppThemeConfig } from '../types';
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
  QrCode,
  Palette,
  Edit3,
  Sparkles,
  Printer,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  school: SchoolProfile;
  theme: AppThemeConfig;
  onResetData: () => void;
  onOpenShare: () => void;
  onOpenTheme: () => void;
  onOpenEditProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  currentUser,
  school,
  theme,
  onResetData,
  onOpenShare,
  onOpenTheme,
  onOpenEditProfile,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'classes', label: 'Manajemen Kelas', icon: Layers },
    { id: 'students', label: 'Manajemen Siswa', icon: Users },
    { id: 'schedules', label: 'Jadwal Mengajar', icon: CalendarDays },
    { id: 'attendance', label: 'Presensi & Rekap', icon: CheckSquare },
    { id: 'grades', label: 'Manajemen Nilai', icon: GraduationCap },
    { id: 'ai-assistant', label: 'Asisten Guru AI', icon: Sparkles },
    { id: 'journals', label: 'Jurnal Harian Guru', icon: BookOpenCheck },
    { id: 'print-documents', label: 'Cetak Dokumen', icon: Printer },
    { id: 'settings', label: 'Profil & Kop Surat', icon: Building },
  ];

  const getActiveTabStyles = (menuColor: string) => {
    switch (menuColor) {
      case 'emerald':
        return {
          btn: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-semibold shadow-xs border-r-2 border-emerald-600',
          icon: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'navy':
        return {
          btn: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-semibold shadow-xs border-r-2 border-blue-600',
          icon: 'text-blue-600 dark:text-blue-400',
        };
      case 'maroon':
        return {
          btn: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-semibold shadow-xs border-r-2 border-rose-600',
          icon: 'text-rose-600 dark:text-rose-400',
        };
      case 'amethyst':
        return {
          btn: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 font-semibold shadow-xs border-r-2 border-purple-600',
          icon: 'text-purple-600 dark:text-purple-400',
        };
      case 'teal':
        return {
          btn: 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-semibold shadow-xs border-r-2 border-teal-600',
          icon: 'text-teal-600 dark:text-teal-400',
        };
      case 'amber':
        return {
          btn: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-semibold shadow-xs border-r-2 border-amber-600',
          icon: 'text-amber-600 dark:text-amber-400',
        };
      case 'slate':
        return {
          btn: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs border-r-2 border-slate-600',
          icon: 'text-slate-800 dark:text-slate-200',
        };
      default:
        return {
          btn: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs border-r-2 border-indigo-600',
          icon: 'text-indigo-600 dark:text-indigo-400',
        };
    }
  };

  const activeStyles = getActiveTabStyles(theme.menuColor);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Mobile Drawer (Desktop menggunakan Menu Bar Horisontal di Atas) */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:hidden shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header Mobile Only */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 md:hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">{school.name}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
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
                      ? activeStyles.btn
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? activeStyles.icon : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Teacher profile & Settings */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5">
          {currentUser && (
            <button
              type="button"
              onClick={() => {
                onOpenEditProfile();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs text-left hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group cursor-pointer"
              title="Klik untuk mengubah nama guru dan NIP"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate flex items-center justify-between">
                  <span>{currentUser.name}</span>
                  <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                  NIP. {currentUser.nip}
                </p>
              </div>
            </button>
          )}

          {/* Theme & Palette Button */}
          <button
            type="button"
            onClick={() => {
              onOpenTheme();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
          >
            <Palette className="w-4 h-4 text-indigo-500" />
            <span>Tema: {theme.mode === 'dark' ? 'Gelap' : 'Terang'} · {theme.menuColor}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => {
              onOpenShare();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/60 shadow-2xs cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Bagikan Link & Barcode</span>
          </button>

          {/* Reset Factory Defaults */}
          <button
            type="button"
            onClick={onResetData}
            title="Kembalikan data contoh awal"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Data Awal</span>
          </button>
        </div>
      </aside>
    </>
  );
};
