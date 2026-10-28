import React from 'react';
import { AppThemeConfig, ThemeMode, MenuTheme } from '../types';
import { Sun, Moon, Palette, Check, X, Sparkles, Layers, Sliders } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppThemeConfig;
  onUpdateTheme: (updated: AppThemeConfig) => void;
}

export interface ThemePresetInfo {
  id: MenuTheme;
  name: string;
  tagline: string;
  desc: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  gradientCss: string;
  previewBg: string;
  accentClass: string;
}

export const THEME_PRESETS: ThemePresetInfo[] = [
  {
    id: 'navy',
    name: 'Navy Bahari SMANSA',
    tagline: 'Klasik & Berwibawa',
    desc: 'Nuansa biru laut dalam resmi khas SMA Negeri 1 Gowa. Terstruktur, elegan, dan menenangkan.',
    primaryHex: '#1d4ed8',
    secondaryHex: '#0284c7',
    accentHex: '#06b6d4',
    gradientCss: 'linear-gradient(135deg, #1e40af 0%, #0284c7 50%, #06b6d4 100%)',
    previewBg: 'bg-blue-900',
    accentClass: 'text-blue-600',
  },
  {
    id: 'emerald',
    name: 'Emerald Hijau Asri',
    tagline: 'Adiwiyata & Edukatif',
    desc: 'Nuansa dedikasi sekolah adiwiyata yang asri, sejuk, dan memanjakan mata saat bekerja seharian.',
    primaryHex: '#059669',
    secondaryHex: '#0d9488',
    accentHex: '#10b981',
    gradientCss: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)',
    previewBg: 'bg-emerald-900',
    accentClass: 'text-emerald-600',
  },
  {
    id: 'indigo',
    name: 'Indigo Modern Tech',
    tagline: 'Cerdas & Futuristik',
    desc: 'Nuansa digital SaaS modern berenergi inovatif, memberi kesan platform administrasi mutakhir.',
    primaryHex: '#4f46e5',
    secondaryHex: '#7c3aed',
    accentHex: '#a855f7',
    gradientCss: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #7c3aed 100%)',
    previewBg: 'bg-indigo-900',
    accentClass: 'text-indigo-600',
  },
  {
    id: 'maroon',
    name: 'Maroon Sutera Makassar',
    tagline: 'Kearifan Lokal Sulsel',
    desc: 'Nuansa tenun sutera Makassar megah, sarat kehormatan budaya lokal Sulawesi Selatan.',
    primaryHex: '#be123c',
    secondaryHex: '#9f1239',
    accentHex: '#f43f5e',
    gradientCss: 'linear-gradient(135deg, #881337 0%, #be123c 50%, #f43f5e 100%)',
    previewBg: 'bg-rose-950',
    accentClass: 'text-rose-600',
  },
  {
    id: 'teal',
    name: 'Teal Samudera Laguna',
    tagline: 'Seimbang & Segar',
    desc: 'Harmoni biru laut toska yang jernih, menghadirkan fokus prima untuk pengelolaan data akademik.',
    primaryHex: '#0f766e',
    secondaryHex: '#0d9488',
    accentHex: '#14b8a6',
    gradientCss: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #14b8a6 100%)',
    previewBg: 'bg-teal-900',
    accentClass: 'text-teal-600',
  },
  {
    id: 'amethyst',
    name: 'Amethyst Ungu Royal',
    tagline: 'Kreatif & Inspiratif',
    desc: 'Aksen ungu mewah kontemporer yang menggugah kreativitas pedagogik dan estetika visual.',
    primaryHex: '#7e22ce',
    secondaryHex: '#9333ea',
    accentHex: '#c084fc',
    gradientCss: 'linear-gradient(135deg, #581c87 0%, #7e22ce 50%, #c084fc 100%)',
    previewBg: 'bg-purple-950',
    accentClass: 'text-purple-600',
  },
  {
    id: 'amber',
    name: 'Amber Cendana Hangat',
    tagline: 'Ramah & Bersahabat',
    desc: 'Nuansa kayu cendana hangat yang membangkitkan keakraban interaksi guru, siswa, dan wali.',
    primaryHex: '#b45309',
    secondaryHex: '#d97706',
    accentHex: '#f59e0b',
    gradientCss: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
    previewBg: 'bg-amber-950',
    accentClass: 'text-amber-600',
  },
  {
    id: 'slate',
    name: 'Slate Karbon Netral',
    tagline: 'Monokrom Minimalis',
    desc: 'Estetika arsitektural bebas distraksi dengan kontras seimbang, memaksimalkan ketelitian kerja.',
    primaryHex: '#334155',
    secondaryHex: '#1e293b',
    accentHex: '#64748b',
    gradientCss: 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #64748b 100%)',
    previewBg: 'bg-slate-900',
    accentClass: 'text-slate-600',
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

  const currentPreset =
    THEME_PRESETS.find((p) => p.id === theme.menuColor) || THEME_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 my-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl text-white shadow-xs"
              style={{ background: currentPreset.gradientCss }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Harmoni Tema & Gaya Tampilan</h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-white/15 text-white/90">
                  Global Theme
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pilih kombinasi warna harmonis dan mode pencahayaan untuk seluruh elemen aplikasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Mode Pencahayaan (Dark vs Light) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Mode Pencahayaan Aplikasi
              </label>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mode saat ini: {theme.mode === 'dark' ? 'Mode Gelap 🌙' : 'Mode Terang ☀️'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModeChange('light')}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  theme.mode === 'light'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <Sun className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold leading-tight">Mode Terang (Light)</p>
                  <p className="text-[10px] font-normal text-slate-500">Kenyamanan siang hari & cetak</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('dark')}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  theme.mode === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 shadow-sm ring-2 ring-indigo-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="p-1.5 bg-indigo-900/80 rounded-lg">
                  <Moon className="w-4 h-4 text-indigo-300" />
                </div>
                <div className="text-left">
                  <p className="font-bold leading-tight">Mode Gelap (Dark)</p>
                  <p className="text-[10px] font-normal text-slate-400">Rendah radiasi & elegan malam</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Pilihan Harmoni Warna & Gradient Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Palet Warna & Color Gradient Harmonis
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Klik tema untuk melihat pratinjau langsung ke seluruh tombol, navbar, tabel, dan formulir
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Tema Aktif: <strong className="text-slate-900 dark:text-white capitalize">{currentPreset.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = theme.menuColor === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleMenuColorChange(preset.id)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none group ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 ring-2 ring-indigo-500/25 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 shadow-2xs'
                    }`}
                  >
                    {/* Top Row: Title, Tagline, Checkmark */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {preset.name}
                          </h4>
                          {isSelected && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-600 text-white">
                              <Check className="w-2.5 h-2.5" /> Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {preset.tagline}
                        </p>
                      </div>

                      {/* Radio Indicator */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* Prominent Color Gradient Bar Preview */}
                    <div className="my-2.5">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                        <span>Color Gradient</span>
                        <span className="font-mono">{preset.primaryHex} → {preset.accentHex}</span>
                      </div>
                      <div
                        className="h-3.5 w-full rounded-md shadow-inner transition-transform group-hover:scale-[1.01]"
                        style={{ background: preset.gradientCss }}
                      />
                    </div>

                    {/* Color Swatch Triplet with Hex */}
                    <div className="flex items-center justify-between gap-2 my-2 py-1.5 px-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0"
                          style={{ backgroundColor: preset.primaryHex }}
                        />
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {preset.primaryHex}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0"
                          style={{ backgroundColor: preset.secondaryHex }}
                        />
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {preset.secondaryHex}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0"
                          style={{ backgroundColor: preset.accentHex }}
                        />
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {preset.accentHex}
                        </span>
                      </div>
                    </div>

                    {/* Mini UI Mockup Preview */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 text-[9px] bg-slate-100 dark:bg-slate-950">
                        {/* Mini Navbar */}
                        <div
                          className="px-2 py-1 flex items-center justify-between text-white font-semibold"
                          style={{ background: preset.gradientCss }}
                        >
                          <span className="truncate">SMAN 1 GOWA</span>
                          <span className="text-[8px] opacity-80">Menu</span>
                        </div>
                        {/* Mini Content Area */}
                        <div className="p-2 flex items-center justify-between bg-white dark:bg-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: preset.primaryHex }}
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              Tabel Nilai
                            </span>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded text-white font-medium text-[8px] shadow-2xs"
                            style={{ backgroundColor: preset.primaryHex }}
                          >
                            Tombol
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Perubahan tema langsung aktif dan tersimpan otomatis.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-xs"
            style={{ background: currentPreset.gradientCss }}
          >
            Terapkan & Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
