import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SchoolProfile, User } from '../types';
import {
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Hand,
  Info,
} from 'lucide-react';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  school: SchoolProfile;
  currentUser: User | null;
  metaInfo?: Array<{ label: string; value: string }>;
  children: React.ReactNode;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  school,
  currentUser,
  metaInfo = [],
  children,
}) => {
  // Zoom state (40% to 250%)
  const [zoom, setZoom] = useState<number>(100);
  // Panning offset when zoomed in
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // References for touch pinch-to-zoom gesture tracking
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartDistRef = useRef<number>(0);
  const touchStartZoomRef = useRef<number>(100);
  const touchPanStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom & pan when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle Zoom In / Out / Reset
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(250, prev + 15));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(40, prev - 15));
  };

  const handleResetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const handleFitWidth = () => {
    if (viewportRef.current) {
      const containerWidth = viewportRef.current.clientWidth - 32;
      // standard document width baseline is ~800px
      const targetZoom = Math.min(200, Math.max(50, Math.round((containerWidth / 800) * 100)));
      setZoom(targetZoom);
      setPan({ x: 0, y: 0 });
    }
  };

  // Touch Gesture Handling for Multi-Touch Pinch-To-Zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // 2 fingers detected: Pinch gesture initiation
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    } else if (e.touches.length === 1 && zoom > 100) {
      // 1 finger drag/panning when zoomed in
      touchPanStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current > 0) {
      // Prevent browser default page pinch zoom so modal viewport absorbs gesture
      if (e.cancelable) e.preventDefault();

      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = currentDist / touchStartDistRef.current;
      const calculatedZoom = Math.round(touchStartZoomRef.current * scaleFactor);
      const clampedZoom = Math.min(250, Math.max(40, calculatedZoom));
      setZoom(clampedZoom);
    } else if (e.touches.length === 1 && zoom > 100 && touchPanStartRef.current) {
      // Panning
      const newX = e.touches[0].clientX - touchPanStartRef.current.x;
      const newY = e.touches[0].clientY - touchPanStartRef.current.y;
      setPan({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchStartDistRef.current = 0;
    }
  };

  // Mouse Drag / Panning when Zoomed In
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 100 && e.button === 0) {
      setIsDragging(true);
      mouseDragStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && zoom > 100) {
      const newX = e.clientX - mouseDragStartRef.current.x;
      const newY = e.clientY - mouseDragStartRef.current.y;
      setPan({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom with Ctrl or Trackpad pinch gesture
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom((prev) => Math.min(250, Math.max(40, prev + delta)));
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-hidden print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:w-full print:h-auto print:max-w-none print:rounded-none">
        
        {/* =========================================================================
            TOOLBAR PRATINJAU & KONTROL ZOOM (Hidden on Print)
            ========================================================================= */}
        <div className="no-print shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title & Document Badge */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Pratinjau Dokumen Cetak Resmi
                </h3>
                <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Standar Kop SMANSA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {title} · Format cetak A4 / Folio Resmi
              </p>
            </div>

            {/* Print & Close Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer theme-bg-primary hover:opacity-95 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Toolbar: Interactive Zoom Controls & Gesture Hint */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Zoom Button Cluster */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 40}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                title="Perkecil (Zoom Out)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Slider for smooth continuous zoom */}
              <div className="hidden sm:flex items-center gap-2 px-2">
                <input
                  type="range"
                  min="40"
                  max="250"
                  step="5"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-24 md:w-32 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  title="Tingkat Pembesaran"
                />
              </div>

              {/* Zoom Percentage Label */}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 px-2 min-w-[50px] text-center text-xs">
                {zoom}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 250}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                title="Perbesar (Zoom In)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

              <button
                type="button"
                onClick={handleResetZoom}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                title="Kembalikan ke Ukuran Asli 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>100%</span>
              </button>

              <button
                type="button"
                onClick={handleFitWidth}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                title="Sesuaikan dengan Lebar Layar"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Pas Layar</span>
              </button>
            </div>

            {/* Gesture Guide Hint */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-medium text-[10px]">
                <Hand className="w-3 h-3" />
                <span>Cubit layar (pinch-to-zoom) untuk memperbesar</span>
              </span>
              {zoom > 100 && (
                <span className="hidden sm:inline text-slate-400">
                  · Geser/drag untuk navigasi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            VIEWPORT AREA DENGAN MULTI-TOUCH PINCH & PAN GESTURE
            ========================================================================= */}
        <div
          ref={viewportRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            touchAction: 'none', // Allows custom touch pinch handling without native scroll conflict
          }}
          className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center bg-slate-200/80 dark:bg-slate-950/80 relative print:p-0 print:bg-white print:overflow-visible print:block"
        >
          {/* Printable Document Paper Card */}
          <div
            id="printable-document-card"
            style={{
              transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'top center',
              transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            className="printable-document-root bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-[820px] p-8 sm:p-12 text-slate-900 text-[11pt] select-text print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:rounded-none print:m-0"
          >
            {/* KOP SURAT RESMI */}
            <div className="border-kop-dinas pb-3 mb-6">
              <div className="flex items-center justify-between gap-4">
                {/* Logo Kiri */}
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{ width: `${school.logoKiriSize || 80}px`, height: `${school.logoKiriSize || 80}px` }}
                >
                  {school.logoKiri ? (
                    <img
                      src={school.logoKiri}
                      alt="Logo Pemda"
                      style={{ maxHeight: `${school.logoKiriSize || 80}px`, maxWidth: `${school.logoKiriSize || 80}px` }}
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400"
                      style={{ width: `${Math.min(64, school.logoKiriSize || 80)}px`, height: `${Math.min(64, school.logoKiriSize || 80)}px` }}
                    >
                      Logo 1
                    </div>
                  )}
                </div>

                {/* Teks Kop Surat */}
                <div className="flex-1 text-center font-serif leading-tight">
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                    {school.kopHeader1 || 'PEMERINTAH PROVINSI SULAWESI SELATAN'}
                  </h4>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                    {school.kopHeader2 || 'DINAS PENDIDIKAN'}
                  </h4>
                  {school.kopHeader3 && (
                    <h4 className="text-xs sm:text-sm font-medium uppercase text-slate-900">
                      {school.kopHeader3}
                    </h4>
                  )}
                  <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-950 mt-0.5">
                    {school.kopHeader4 || school.name || 'UPT SMA NEGERI 1 GOWA'}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-sans text-slate-700 mt-1">
                    {school.kopSubheader || school.address}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-sans text-slate-600">
                    {school.kopContact || `Telp: ${school.phone} · Website: ${school.website}`}
                  </p>
                </div>

                {/* Logo Kanan */}
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{ width: `${school.logoKananSize || 80}px`, height: `${school.logoKananSize || 80}px` }}
                >
                  {school.logoKanan ? (
                    <img
                      src={school.logoKanan}
                      alt="Logo Sekolah"
                      style={{ maxHeight: `${school.logoKananSize || 80}px`, maxWidth: `${school.logoKananSize || 80}px` }}
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400"
                      style={{ width: `${Math.min(64, school.logoKananSize || 80)}px`, height: `${Math.min(64, school.logoKananSize || 80)}px` }}
                    >
                      Logo 2
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DOKUMEN TITLE */}
            <div className="text-center my-4">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide underline underline-offset-4 decoration-1">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
            </div>

            {/* DOKUMEN META INFO */}
            {metaInfo.length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 my-4 text-xs bg-slate-50 print:bg-transparent p-3 print:p-0 rounded border border-slate-200 print:border-none">
                {metaInfo.map((info, idx) => (
                  <div key={idx} className="flex">
                    <span className="w-32 font-medium text-slate-600 print:text-black">{info.label}</span>
                    <span className="mr-2">:</span>
                    <span className="font-semibold text-slate-900 print:text-black">{info.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* MAIN DOCUMENT BODY */}
            <div className="my-4">{children}</div>

            {/* SIGNATURE SECTION */}
            <div className="mt-12 pt-4 flex justify-between items-start text-xs text-slate-900 break-inside-avoid">
              {/* Mengetahui Kepala Sekolah */}
              <div className="text-center w-56">
                <p>Mengetahui,</p>
                <p className="font-medium">Kepala UPT SMA Negeri 1 Gowa</p>
                <div className="h-20"></div>
                <p className="font-bold underline uppercase">{school.headmaster || 'Drs. H. Arsyad, M.Pd.'}</p>
                <p className="text-[11px] text-slate-700">NIP. {school.headmasterNip || '19680512 199412 1 002'}</p>
              </div>

              {/* Guru Pengampu */}
              <div className="text-center w-56">
                <p>Sungguminasa, {todayFormatted}</p>
                <p className="font-medium">Guru Mata Pelajaran,</p>
                <div className="h-20"></div>
                <p className="font-bold underline uppercase">{currentUser?.name || 'Andi Ismail, S.Pd.'}</p>
                <p className="text-[11px] text-slate-700">NIP. {currentUser?.nip || '19880815 201403 1 004'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
