import React from 'react';
import { User, SchoolProfile } from '../types';
import { Menu, LogOut, UserCircle } from 'lucide-react';

interface HeaderProps {
  school: SchoolProfile;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onOpenShare: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  school,
  currentUser,
  onOpenAuth,
  onLogout,
  onToggleSidebar,
  onOpenShare,
  activeTab,
}) => {
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'classes':
        return 'Manajemen Kelas';
      case 'students':
        return 'Data Siswa';
      case 'schedules':
        return 'Jadwal Mengajar';
      case 'attendance':
        return 'Presensi & Absensi';
      case 'grades':
        return 'Penilaian Siswa';
      case 'journals':
        return 'Jurnal Harian';
      case 'settings':
        return 'Profil & Kop Surat';
      default:
        return 'Administrasi';
    }
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 max-w-7xl mx-auto">
        {/* Zone 1: Brand wordmark & mobile trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a href="#" className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group">
            {school.logoKanan ? (
              <img
                src={school.logoKanan}
                alt={school.name}
                className="w-7 h-7 object-contain rounded"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              {school.name || 'SMAN 1 Gowa'}
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation contextual metadata */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap truncate">
          <span>T.A. {school.academicYear}</span>
          <span aria-hidden="true">·</span>
          <span>Semester {school.semester}</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-800 font-semibold">{getTabLabel(activeTab)}</span>
        </div>

        {/* Zone 3: Primary actions & User status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Bagikan Tautan & Barcode QR Code"
          >
            <span className="text-indigo-600 font-bold">☵</span>
            <span>Bagikan / Barcode</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentUser.subject}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Keluar Akun"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <UserCircle className="w-4 h-4" />
              <span>Masuk Guru</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
