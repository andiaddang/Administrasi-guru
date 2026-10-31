import React from 'react';
import { User, SchoolProfile, AppThemeConfig, MenuTheme, ThemeMode } from '../types';
import { Menu, LogOut, UserCircle, Palette, Sun, Moon, Edit3, Camera } from 'lucide-react';

interface HeaderProps {
  school: SchoolProfile;
  currentUser: User | null;
  theme: AppThemeConfig;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onOpenShare: () => void;
  onOpenTheme: () => void;
  onToggleThemeMode: () => void;
  onOpenEditProfile: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  school,
  currentUser,
  theme,
  onOpenAuth,
  onLogout,
  onToggleSidebar,
  onOpenShare,
  onOpenTheme,
  onToggleThemeMode,
  onOpenEditProfile,
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
      case 'print-documents':
        return 'Cetak Dokumen';
      case 'settings':
        return 'Profil & Kop Surat';
      default:
        return 'Administrasi';
    }
  };

  const getThemeHeaderStyles = (menuColor: MenuTheme, mode: ThemeMode) => {
    if (mode === 'dark') {
      switch (menuColor) {
        case 'emerald':
          return 'bg-slate-900 border-b border-emerald-900/50';
        case 'navy':
          return 'bg-slate-900 border-b border-blue-900/50';
        case 'maroon':
          return 'bg-stone-900 border-b border-rose-950';
        case 'amethyst':
          return 'bg-slate-900 border-b border-purple-900/50';
        case 'teal':
          return 'bg-slate-900 border-b border-teal-900/50';
        case 'amber':
          return 'bg-stone-900 border-b border-amber-950/60';
        case 'slate':
          return 'bg-zinc-900 border-b border-zinc-800';
        default:
          return 'bg-slate-900 border-b border-slate-800';
      }
    }
    switch (menuColor) {
      case 'emerald':
        return 'bg-emerald-50/60 border-b border-emerald-200/80';
      case 'navy':
        return 'bg-blue-50/50 border-b border-blue-200/80';
      case 'maroon':
        return 'bg-rose-50/50 border-b border-rose-200/80';
      case 'amethyst':
        return 'bg-purple-50/50 border-b border-purple-200/80';
      case 'teal':
        return 'bg-teal-50/50 border-b border-teal-200/80';
      case 'amber':
        return 'bg-amber-50/50 border-b border-amber-200/80';
      case 'slate':
        return 'bg-slate-100/70 border-b border-slate-300';
      default:
        return 'bg-white border-b border-slate-200';
    }
  };

  const getAccentDot = (menuColor: MenuTheme) => {
    switch (menuColor) {
      case 'emerald':
        return 'bg-emerald-500';
      case 'navy':
        return 'bg-blue-600';
      case 'maroon':
        return 'bg-rose-700';
      case 'amethyst':
        return 'bg-purple-600';
      case 'teal':
        return 'bg-teal-500';
      case 'amber':
        return 'bg-amber-600';
      case 'slate':
        return 'bg-slate-700';
      default:
        return 'bg-indigo-600';
    }
  };

  return (
    <div
      className={`w-full transition-colors ${getThemeHeaderStyles(
        theme.menuColor,
        theme.mode
      )}`}
    >
      <div className="flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3.5 max-w-7xl mx-auto">
        {/* Zone 1: Brand wordmark & mobile trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {school.name || 'SMAN 1 Gowa'}
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation contextual metadata */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">
          <span>T.A. {school.academicYear}</span>
          <span aria-hidden="true">·</span>
          <span>Semester {school.semester}</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{getTabLabel(activeTab)}</span>
        </div>

        {/* Zone 3: Primary actions & User status */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Dark / Light Mode Switcher */}
          <button
            type="button"
            onClick={onToggleThemeMode}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            title={theme.mode === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            aria-label="Toggle Mode Gelap/Terang"
          >
            {theme.mode === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
            )}
            <span className="hidden md:inline text-[11px] font-semibold">
              {theme.mode === 'dark' ? 'Terang' : 'Gelap'}
            </span>
          </button>

          {/* Menu Bar Color & Theme Customizer Button */}
          <button
            type="button"
            onClick={onOpenTheme}
            className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Pilih Warna Menu Bar & Aksen Aplikasi"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${getAccentDot(theme.menuColor)} ring-1 ring-black/10 dark:ring-white/20`} />
            <span className="hidden sm:inline text-[11px] font-semibold">Warna Menu</span>
          </button>

          {/* Share Link & Barcode Button */}
          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 bg-white/80 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Bagikan Tautan & Barcode QR Code"
          >
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">☵</span>
            <span className="hidden sm:inline">Bagikan / Barcode</span>
          </button>

          {/* Teacher Profile / Login */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onOpenEditProfile}
                title="Klik untuk mengubah foto profil, nama guru, dan NIP"
                className="flex items-center gap-2.5 p-1 sm:pl-2.5 sm:pr-1.5 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all cursor-pointer group border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white/50 dark:bg-slate-800/50 shadow-2xs"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-tight flex items-center justify-end gap-1">
                    <span>{currentUser.name}</span>
                    <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    NIP. {currentUser.nip}
                  </span>
                </div>

                {/* Profile Photo Avatar in corner */}
                <div className="relative shrink-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-indigo-500/40 group-hover:ring-indigo-600 transition-all bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center shadow-xs">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                        {currentUser.name ? currentUser.name.charAt(0) : 'G'}
                      </div>
                    )}
                  </div>
                  {/* Camera icon hover overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  {/* Status Indicator Dot */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
                    title="Akun Guru Aktif"
                  />
                </div>
              </button>

              <button
                onClick={onLogout}
                title="Keluar Akun"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Keluar</span>
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
    </div>
  );
};
