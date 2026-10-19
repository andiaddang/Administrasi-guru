import React from 'react';
import { AppThemeConfig, ThemeMode, MenuTheme } from '../types';
import { Sun, Moon, Palette, Check, X, Sparkles } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppThemeConfig;
  onUpdateTheme: (updated: AppThemeConfig) => void;
}

export const THEME_PRESETS: Array<{
  id: MenuTheme;
  name: string;
  desc: string;
  headerBgLight: string;
  headerBgDark: string;
  accentClass: string;
  colorSwatch: string;
}> = [
  {
    id: 'indigo',
    name: 'Indigo Modern',
    desc: 'Nuansa profesional kontemporer khas SMAN 1 Gowa',
    headerBgLight: 'bg-white',
    headerBgDark: 'bg-slate-900',
    accentClass: 'text-indigo-600',
    colorSwatch: 'bg-indigo-600',
  },
  {
    id: 'emerald',
    name: 'Emerald Hijau Asri',
    desc: 'Nuansa hijau sejuk pendidikan berkarakter dan adiwiyata',
    headerBgLight: 'bg-white',
    headerBgDark: 'bg-slate-900',
    accentClass: 'text-emerald-600',
    colorSwatch: 'bg-emerald-600',
  },
  {
    id: 'navy',
    name: 'Navy Bahari Klasik',
    desc: 'Nuansa biru laut dalam yang wibawa dan fokus',
    headerBgLight: 'bg-white',
    headerBgDark: 'bg-slate-900',
    accentClass: 'text-blue-600',
    colorSwatch: 'bg-blue-700',
  },
  {
    id: 'slate',
    name: 'Slate Karbon Netral',
    desc: 'Nuansa monokrom arsitektural minimalis & bersih',
    headerBgLight: 'bg-white',
    headerBgDark: 'bg-zinc-900',
    accentClass: 'text-slate-800',
    colorSwatch: 'bg-slate-800',
  },
  {
    id: 'maroon',
    name: 'Maroon Sutera Makassar',
    desc: 'Nuansa merah marun megah khas kearifan lokal Sulawesi Selatan',
    headerBgLight: 'bg-white',
    headerBgDark: 'bg-stone-900',
    accentClass: 'text-rose-700',
    colorSwatch: 'bg-rose-800',
  },
  {
    id: 'amethyst',
    name: 'Amethyst Ungu Royal',
    desc: 'Nuansa elegan modern dengan aksen ungu estetis',
    headerBgLight: 'bg-white',
    headerBgDark: 'bg-slate-900',
    accentClass: 'text-purple-600',
    colorSwatch: 'bg-purple-600',
  },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  theme,
  onUpdateTheme,
}) => {
  if (!isOpen) return null;

  const handleModeChange = (mode: ThemeMode) => {
    onUpdateTheme({ ...theme, mode });
  };

  const handleMenuColorChange = (menuColor: MenuTheme) => {
    onUpdateTheme({ ...theme, menuColor });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Palette className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Kustomisasi Tema & Tampilan</h3>
              <p className="text-xs text-slate-300">Pilih mode gelap/terang dan warna menu bar aplikasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Section 1: Dark vs Light Mode */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Mode Pencahayaan:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModeChange('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme.mode === 'light'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Mode Terang (Light)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme.mode === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 ring-2 ring-indigo-500/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Mode Gelap (Dark)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Menu Bar / Accent Color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Pilihan Warna Aksen & Menu Bar:
              </label>
              <span className="text-[11px] text-slate-500 capitalize">
                Aktif: {theme.menuColor}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = theme.menuColor === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleMenuColorChange(preset.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800/80 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full ${preset.colorSwatch} shrink-0 mt-0.5 flex items-center justify-center shadow-xs`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {preset.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-xs"
            >
              Terapkan & Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
