import React, { useRef } from 'react';
import { AppThemeConfig, MenuTheme } from '../types';
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TopMenuBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: AppThemeConfig;
  onResetData?: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  onResetData,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'classes', label: 'Manajemen Kelas', icon: Layers },
    { id: 'students', label: 'Manajemen Siswa', icon: Users },
    { id: 'schedules', label: 'Jadwal Mengajar', icon: CalendarDays },
    { id: 'attendance', label: 'Presensi & Rekap', icon: CheckSquare },
    { id: 'grades', label: 'Manajemen Nilai', icon: GraduationCap },
    { id: 'ai-assistant', label: 'Asisten Guru AI', icon: Sparkles },
    { id: 'journals', label: 'Jurnal Harian Guru', icon: BookOpenCheck },
    { id: 'settings', label: 'Profil & Kop Surat', icon: Building },
  ];

  const getThemeNavStyles = (menuColor: MenuTheme) => {
    switch (menuColor) {
      case 'emerald':
        return {
          barBg: 'bg-emerald-50/50 dark:bg-slate-900/95 border-b border-emerald-200/80 dark:border-emerald-950',
          activeBtn:
            'bg-white dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold border-b-2 border-emerald-600 dark:border-emerald-400 shadow-2xs',
          activeIcon: 'text-emerald-600 dark:text-emerald-400',
          hoverBtn: 'hover:bg-emerald-100/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
        };
      case 'navy':
        return {
          barBg: 'bg-blue-50/40 dark:bg-slate-900/95 border-b border-blue-200/80 dark:border-blue-950',
          activeBtn:
            'bg-white dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 font-bold border-b-2 border-blue-600 dark:border-blue-400 shadow-2xs',
          activeIcon: 'text-blue-600 dark:text-blue-400',
          hoverBtn: 'hover:bg-blue-100/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
        };
      case 'maroon':
        return {
          barBg: 'bg-rose-50/40 dark:bg-stone-900/95 border-b border-rose-200/80 dark:border-rose-950',
          activeBtn:
            'bg-white dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 font-bold border-b-2 border-rose-700 dark:border-rose-500 shadow-2xs',
          activeIcon: 'text-rose-700 dark:text-rose-400',
          hoverBtn: 'hover:bg-rose-100/60 dark:hover:bg-stone-800 text-slate-600 dark:text-slate-300',
        };
      case 'amethyst':
        return {
          barBg: 'bg-purple-50/40 dark:bg-slate-900/95 border-b border-purple-200/80 dark:border-purple-950',
          activeBtn:
            'bg-white dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 font-bold border-b-2 border-purple-600 dark:border-purple-400 shadow-2xs',
          activeIcon: 'text-purple-600 dark:text-purple-400',
          hoverBtn: 'hover:bg-purple-100/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
        };
      case 'slate':
        return {
          barBg: 'bg-slate-100/70 dark:bg-zinc-900/95 border-b border-slate-300 dark:border-zinc-800',
          activeBtn:
            'bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 font-bold border-b-2 border-slate-700 dark:border-slate-300 shadow-2xs',
          activeIcon: 'text-slate-800 dark:text-slate-200',
          hoverBtn: 'hover:bg-slate-200/70 dark:hover:bg-zinc-800/60 text-slate-600 dark:text-slate-300',
        };
      default:
        return {
          barBg: 'bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800',
          activeBtn:
            'bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-200 font-bold border-b-2 border-indigo-600 dark:border-indigo-400 shadow-2xs',
          activeIcon: 'text-indigo-600 dark:text-indigo-400',
          hoverBtn: 'hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
        };
    }
  };

  const navStyles = getThemeNavStyles(theme.menuColor);

  const scrollNav = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`no-print w-full backdrop-blur-md transition-colors ${navStyles.barBg}`}
      aria-label="Menu Utama Navigasi Horisontal"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 relative flex items-center justify-between gap-2">
        {/* Tombol Geser Kiri (Mobile/Tablet Overflow) */}
        <button
          type="button"
          onClick={() => scrollNav('left')}
          className="hidden md:flex lg:hidden items-center justify-center p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md shrink-0 cursor-pointer transition-colors"
          title="Geser menu ke kiri"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Horizontal Navigation Items Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1.5 scroll-smooth"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`group flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs tracking-tight transition-all shrink-0 cursor-pointer select-none whitespace-nowrap ${
                  isActive ? navStyles.activeBtn : navStyles.hoverBtn
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                    isActive
                      ? navStyles.activeIcon
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`}
                />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tombol Geser Kanan (Mobile/Tablet Overflow) */}
        <button
          type="button"
          onClick={() => scrollNav('right')}
          className="hidden md:flex lg:hidden items-center justify-center p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md shrink-0 cursor-pointer transition-colors"
          title="Geser menu ke kanan"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Opsi Reset Data di Ujung Kanan (Opsional) */}
        {onResetData && (
          <div className="hidden xl:flex items-center pl-2 border-l border-slate-200/80 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Reset data ke konfigurasi default SMAN 1 Gowa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
