import React, { useState, useRef, useEffect } from 'react';
import { SchoolProfile, User } from '../types';
import {
  DocumentExportService,
  DocumentPageSettings,
  DEFAULT_PAGE_SETTINGS,
  PaperSize,
  PageOrientation,
  MarginOption,
  ExportFormat,
  getMarginsInMm,
  getPaperDimensionsInMm,
} from '../services/documentExportService';
import {
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Hand,
  Download,
  Cloud,
  FileText,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  school: SchoolProfile;
  currentUser: User | null;
  metaInfo?: Array<{ label: string; value: string }>;
  tableHeaders?: string[];
  tableRows?: string[][];
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
  tableHeaders,
  tableRows,
  children,
}) => {
  // Page Setup state
  const [pageSettings, setPageSettings] = useState<DocumentPageSettings>(DEFAULT_PAGE_SETTINGS);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [isCustomMarginOpen, setIsCustomMarginOpen] = useState(false);

  // Zoom & Pan state (Separated from real print dimensions!)
  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Export process state
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    type: 'success' | 'error';
    link?: string;
    linkText?: string;
  } | null>(null);

  // References for viewport & gesture handling
  const viewportRef = useRef<HTMLDivElement>(null);
  const documentCardRef = useRef<HTMLDivElement>(null);
  const touchStartDistRef = useRef<number>(0);
  const touchStartZoomRef = useRef<number>(100);
  const touchPanStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const showToast = (
    text: string,
    type: 'success' | 'error' = 'success',
    link?: string,
    linkText?: string
  ) => {
    setToastMsg({ text, type, link, linkText });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Reset viewport state when opening modal
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Zoom button handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(250, prev + 15));
  const handleZoomOut = () => setZoom((prev) => Math.max(40, prev - 15));
  const handleResetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const handleFitWidth = () => {
    if (viewportRef.current) {
      const containerWidth = viewportRef.current.clientWidth - 48;
      const dims = getPaperDimensionsInMm(pageSettings);
      // Rough mm to px ratio in preview ~3.78px per mm
      const docPxWidth = dims.width * 3.78;
      const targetZoom = Math.min(200, Math.max(45, Math.round((containerWidth / docPxWidth) * 100)));
      setZoom(targetZoom);
      setPan({ x: 0, y: 0 });
    }
  };

  // Touch Gesture Handling for Multi-Touch Pinch-To-Zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    } else if (e.touches.length === 1 && zoom > 100) {
      touchPanStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current > 0) {
      if (e.cancelable) e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = currentDist / touchStartDistRef.current;
      const calculatedZoom = Math.round(touchStartZoomRef.current * scaleFactor);
      setZoom(Math.min(250, Math.max(40, calculatedZoom)));
    } else if (e.touches.length === 1 && zoom > 100 && touchPanStartRef.current) {
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

  // Mouse Drag / Panning
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

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom((prev) => Math.min(250, Math.max(40, prev + delta)));
    }
  };

  // Extract table rows from DOM if not passed via props
  const getParsedTable = () => {
    if (tableHeaders && tableRows) {
      return { headers: tableHeaders, rows: tableRows };
    }
    if (documentCardRef.current) {
      const table = documentCardRef.current.querySelector('table');
      if (table) {
        const ths = Array.from(table.querySelectorAll('thead th, tr:first-child th'));
        const headers = ths.map((th) => th.textContent?.trim() || '');
        const trs = Array.from(table.querySelectorAll('tbody tr'));
        const rows = trs.map((tr) => {
          const tds = Array.from(tr.querySelectorAll('td'));
          return tds.map((td) => td.textContent?.trim() || '');
        });
        return { headers, rows };
      }
    }
    return { headers: [], rows: [] };
  };

  // Base filename clean helper
  const getCleanFilename = (ext: 'pdf' | 'docx') => {
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const dateStr = new Date().toISOString().slice(0, 10);
    return `${cleanTitle}_${school.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}_${dateStr}.${ext}`;
  };

  // 1. ACTION: Print Strictly Preview
  const handlePrint = () => {
    if (!documentCardRef.current) return;
    DocumentExportService.printIsolated(documentCardRef.current, pageSettings, title);
  };

  // 2. ACTION: Download to Device
  const handleDownloadToDevice = async () => {
    if (!documentCardRef.current) return;
    setIsDownloading(true);
    try {
      if (exportFormat === 'pdf') {
        const blob = await DocumentExportService.generatePdfBlob(
          documentCardRef.current,
          pageSettings
        );
        DocumentExportService.downloadBlob(blob, getCleanFilename('pdf'));
        showToast('Dokumen PDF berhasil diunduh ke perangkat Anda!');
      } else {
        const parsed = getParsedTable();
        const blob = await DocumentExportService.generateDocxBlob(
          school,
          currentUser,
          title,
          subtitle,
          metaInfo,
          parsed.headers,
          parsed.rows,
          pageSettings
        );
        DocumentExportService.downloadBlob(blob, getCleanFilename('docx'));
        showToast('Dokumen Word (DOCX) berhasil diunduh ke perangkat Anda!');
      }
    } catch (err: any) {
      console.error('Download error:', err);
      showToast(err.message || 'Gagal mengunduh dokumen', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // 3. ACTION: Export & Upload to Google Drive
  const handleExportToGoogleDrive = async () => {
    if (!documentCardRef.current) return;
    setIsExportingDrive(true);
    try {
      if (exportFormat === 'pdf') {
        const blob = await DocumentExportService.generatePdfBlob(
          documentCardRef.current,
          pageSettings
        );
        const res = await DocumentExportService.uploadToGoogleDrive(
          blob,
          getCleanFilename('pdf'),
          school.name
        );
        showToast(
          `Dokumen PDF berhasil disimpan ke Google Drive (${res.fileName})!`,
          'success',
          res.webViewLink || res.folderUrl,
          'Buka di Google Drive'
        );
      } else {
        const parsed = getParsedTable();
        const blob = await DocumentExportService.generateDocxBlob(
          school,
          currentUser,
          title,
          subtitle,
          metaInfo,
          parsed.headers,
          parsed.rows,
          pageSettings
        );
        const res = await DocumentExportService.uploadToGoogleDrive(
          blob,
          getCleanFilename('docx'),
          school.name
        );
        showToast(
          `Dokumen Word (DOCX) berhasil disimpan ke Google Drive (${res.fileName})!`,
          'success',
          res.webViewLink || res.folderUrl,
          'Buka di Google Drive'
        );
      }
    } catch (err: any) {
      console.error('Google Drive export error:', err);
      showToast(err.message || 'Gagal menyimpan dokumen ke Google Drive', 'error');
    } finally {
      setIsExportingDrive(false);
    }
  };

  const margins = getMarginsInMm(pageSettings);
  const dims = getPaperDimensionsInMm(pageSettings);
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-hidden print:p-0 print:bg-white print:static">
      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`fixed top-6 right-6 z-60 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-2 text-white ${
            toastMsg.type === 'success'
              ? 'bg-slate-900 border border-emerald-500/60'
              : 'bg-rose-950 border border-rose-500/60'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
          {toastMsg.link && (
            <a
              href={toastMsg.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors ml-1"
            >
              <span>{toastMsg.linkText || 'Buka'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:w-full print:h-auto print:max-w-none print:rounded-none">
        
        {/* =========================================================================
            HEADER TOOLBAR (Cetak & Fitur Ekspor 2 Pilihan)
            ========================================================================= */}
        <div className="no-print shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Title & Document Badge */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Pratinjau & Pengaturan Cetak Dokumen
                </h3>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  {pageSettings.paperSize} · {pageSettings.orientation === 'portrait' ? 'Potret' : 'Lanskap'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {title} · Format Ekspor Aktif: <strong className="text-slate-700 dark:text-slate-200">{exportFormat.toUpperCase()}</strong>
              </p>
            </div>

            {/* Print & 2-Choice Export Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Button: Cetak Sesuai Tampilan */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95"
                title="Cetak lembar dokumen yang sedang ditampilkan"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Lembar Ini</span>
              </button>

              {/* Button: Unduh ke Perangkat */}
              <button
                type="button"
                onClick={handleDownloadToDevice}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:opacity-50 active:scale-95"
                title={`Unduh ${exportFormat.toUpperCase()} langsung ke komputer atau perangkat Anda`}
              >
                {isDownloading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Unduh ke Perangkat ({exportFormat.toUpperCase()})</span>
              </button>

              {/* Button: Simpan ke Google Drive */}
              <button
                type="button"
                onClick={handleExportToGoogleDrive}
                disabled={isExportingDrive}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-95"
                title={`Simpan ${exportFormat.toUpperCase()} ke Google Drive dalam folder Administrasi Guru`}
              >
                {isExportingDrive ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>Simpan ke Drive</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* =========================================================================
              BAR PENGATURAN HALAMAN & FORMAT DOKUMEN (Otomatis Memperbarui Pratinjau)
              ========================================================================= */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Group 1: Page Controls (Kertas, Orientasi, Margin, Format) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Paper Size Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Kertas:</span>
                <button
                  type="button"
                  onClick={() => setPageSettings((prev) => ({ ...prev, paperSize: 'A4' }))}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    pageSettings.paperSize === 'A4'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  A4 (210×297)
                </button>
                <button
                  type="button"
                  onClick={() => setPageSettings((prev) => ({ ...prev, paperSize: 'F4' }))}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    pageSettings.paperSize === 'F4'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  F4 / Folio (215×330)
                </button>
              </div>

              {/* Orientation Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Orientasi:</span>
                <button
                  type="button"
                  onClick={() => setPageSettings((prev) => ({ ...prev, orientation: 'portrait' }))}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    pageSettings.orientation === 'portrait'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Potret
                </button>
                <button
                  type="button"
                  onClick={() => setPageSettings((prev) => ({ ...prev, orientation: 'landscape' }))}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    pageSettings.orientation === 'landscape'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Lanskap
                </button>
              </div>

              {/* Margin Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Margin:</span>
                {(['normal', 'narrow', 'moderate'] as MarginOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setPageSettings((prev) => ({ ...prev, marginOption: opt }));
                      setIsCustomMarginOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors capitalize ${
                      pageSettings.marginOption === opt
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {opt === 'normal' ? 'Normal (2.5cm)' : opt === 'narrow' ? 'Sempit (1.5cm)' : 'Sedang (2cm)'}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsCustomMarginOpen(!isCustomMarginOpen)}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                    pageSettings.marginOption === 'custom'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>Kustom</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Custom Margin Popover */}
                {isCustomMarginOpen && (
                  <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 w-64 text-xs space-y-2 animate-in fade-in">
                    <p className="font-bold text-slate-800 dark:text-slate-100">Atur Margin Kustom (mm):</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Atas (mm)</label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={pageSettings.customMargins?.top || 25}
                          onChange={(e) =>
                            setPageSettings((prev) => ({
                              ...prev,
                              marginOption: 'custom',
                              customMargins: {
                                ...(prev.customMargins || { top: 25, bottom: 25, left: 25, right: 25 }),
                                top: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full p-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Bawah (mm)</label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={pageSettings.customMargins?.bottom || 25}
                          onChange={(e) =>
                            setPageSettings((prev) => ({
                              ...prev,
                              marginOption: 'custom',
                              customMargins: {
                                ...(prev.customMargins || { top: 25, bottom: 25, left: 25, right: 25 }),
                                bottom: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full p-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Kiri (mm)</label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={pageSettings.customMargins?.left || 25}
                          onChange={(e) =>
                            setPageSettings((prev) => ({
                              ...prev,
                              marginOption: 'custom',
                              customMargins: {
                                ...(prev.customMargins || { top: 25, bottom: 25, left: 25, right: 25 }),
                                left: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full p-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Kanan (mm)</label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={pageSettings.customMargins?.right || 25}
                          onChange={(e) =>
                            setPageSettings((prev) => ({
                              ...prev,
                              marginOption: 'custom',
                              customMargins: {
                                ...(prev.customMargins || { top: 25, bottom: 25, left: 25, right: 25 }),
                                right: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full p-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Format Dokumen Selector: PDF vs Word (DOCX) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Format:</span>
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                    exportFormat === 'pdf'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>PDF (.pdf)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('docx')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                    exportFormat === 'docx'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Word (.docx)</span>
                </button>
              </div>
            </div>

            {/* Group 2: Interactive Zoom Controls (Visually scaled, does NOT alter print output) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 40}
                className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                title="Perkecil Tampilan"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min="40"
                max="250"
                step="5"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-16 sm:w-24 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                title="Zoom Tampilan Layar"
              />

              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 px-1 min-w-[42px] text-center text-xs">
                {zoom}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 250}
                className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                title="Perbesar Tampilan"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-0.5" />

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Kembalikan ke 100%"
              >
                100%
              </button>

              <button
                type="button"
                onClick={handleFitWidth}
                className="px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                title="Sesuaikan dengan Lebar Layar"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Pas Layar</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            VIEWPORT PRATINJAU DOKUMEN (Fixed Preview dengan Pan & Gestur Pinch)
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
            touchAction: 'none',
          }}
          className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center bg-slate-200/90 dark:bg-slate-950/90 relative print:p-0 print:bg-white print:overflow-visible print:block"
        >
          {/* Printable Document Paper Card
              - Physical dimensions are set in real mm (A4: 210×297, F4: 215×330, or Landscape swapped)
              - Zoom is strictly visual via transform scale, preserving print & export proportions */}
          <div
            id="printable-document-card"
            ref={documentCardRef}
            style={{
              width: `${dims.width}mm`,
              minHeight: `${dims.height}mm`,
              padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
              transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'top center',
              transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            className="printable-document-root bg-white rounded-lg shadow-2xl border border-slate-300 text-slate-900 text-[10.5pt] select-text box-border relative flex flex-col justify-between print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:rounded-none print:m-0"
          >
            <div>
              {/* KOP SURAT RESMI */}
              <div className="border-kop-dinas pb-3 mb-5 border-b-2 border-black">
                <div className="flex items-center justify-between gap-4">
                  {/* Logo Kiri */}
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: `${school.logoKiriSize || 80}px`,
                      height: `${school.logoKiriSize || 80}px`,
                    }}
                  >
                    {school.logoKiri ? (
                      <img
                        src={school.logoKiri}
                        alt="Logo Pemda"
                        style={{
                          maxHeight: `${school.logoKiriSize || 80}px`,
                          maxWidth: `${school.logoKiriSize || 80}px`,
                        }}
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400"
                        style={{
                          width: `${Math.min(64, school.logoKiriSize || 80)}px`,
                          height: `${Math.min(64, school.logoKiriSize || 80)}px`,
                        }}
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
                    style={{
                      width: `${school.logoKananSize || 80}px`,
                      height: `${school.logoKananSize || 80}px`,
                    }}
                  >
                    {school.logoKanan ? (
                      <img
                        src={school.logoKanan}
                        alt="Logo Sekolah"
                        style={{
                          maxHeight: `${school.logoKananSize || 80}px`,
                          maxWidth: `${school.logoKananSize || 80}px`,
                        }}
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400"
                        style={{
                          width: `${Math.min(64, school.logoKananSize || 80)}px`,
                          height: `${Math.min(64, school.logoKananSize || 80)}px`,
                        }}
                      >
                        Logo 2
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DOKUMEN TITLE */}
              <div className="text-center my-3">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide underline underline-offset-4 decoration-1">
                  {title}
                </h3>
                {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
              </div>

              {/* DOKUMEN META INFO */}
              {metaInfo.length > 0 && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 my-3 text-xs bg-slate-50 print:bg-transparent p-2.5 print:p-0 rounded border border-slate-200 print:border-none">
                  {metaInfo.map((info, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-32 font-medium text-slate-600 print:text-black">
                        {info.label}
                      </span>
                      <span className="mr-2">:</span>
                      <span className="font-semibold text-slate-900 print:text-black">
                        {info.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* MAIN CONTENT BODY (TABLE / LIST) */}
              <div className="my-3 overflow-x-auto">{children}</div>
            </div>

            {/* FOOTER & SIGNATURE SECTION */}
            <div className="mt-8 pt-4 break-inside-avoid">
              <div className="flex justify-between items-start text-xs text-slate-900">
                {/* Mengetahui Kepala Sekolah */}
                <div className="text-center w-56">
                  <p>Mengetahui,</p>
                  <p className="font-medium">Kepala UPT SMA Negeri 1 Gowa</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline uppercase">
                    {school.headmaster || 'Drs. H. Arsyad, M.Pd.'}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    NIP. {school.headmasterNip || '19680512 199412 1 002'}
                  </p>
                </div>

                {/* Guru Pengampu */}
                <div className="text-center w-56">
                  <p>Sungguminasa, {todayFormatted}</p>
                  <p className="font-medium">Guru Mata Pelajaran,</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline uppercase">
                    {currentUser?.name || 'Andi Ismail, S.Pd.'}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    NIP. {currentUser?.nip || '19880815 201403 1 004'}
                  </p>
                </div>
              </div>

              {/* Page Numbering & System Footer */}
              <div className="mt-6 pt-2 border-t border-slate-200 text-[9px] text-slate-500 flex justify-between items-center print:border-slate-400">
                <span>Dokumen Resmi · Dicetak melalui Sistem Administrasi Guru SMAN 1 Gowa</span>
                <span className="font-mono font-medium">Halaman 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
