import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { SchoolProfile, User } from '../types';
import {
  Share2,
  Copy,
  Check,
  Download,
  Printer,
  X,
  QrCode,
  Send,
  ExternalLink,
  MessageCircle,
  Building2,
} from 'lucide-react';
import { PrintDocumentModal } from './PrintDocumentModal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolProfile;
  currentUser: User | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  school,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'app' | 'schedule' | 'grades'>('app');
  const [isPrintPosterOpen, setIsPrintPosterOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute the current shareable URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sman1gowa.sch.id';
  
  const getShareUrl = () => {
    if (selectedTarget === 'schedule') {
      return `${baseUrl}?tab=schedules`;
    }
    if (selectedTarget === 'grades') {
      return `${baseUrl}?tab=grades`;
    }
    return baseUrl;
  };

  const currentUrl = getShareUrl();

  // Render QR Code on canvas
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure canvas element is mounted in DOM
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          currentUrl,
          {
            width: 240,
            margin: 2,
            color: {
              dark: '#0f172a', // Slate-900
              light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
          },
          (error) => {
            if (error) console.error('Error generating QR code:', error);
          }
        );
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, currentUrl, selectedTarget]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_Code_${school.name.replace(/\s+/g, '_')}_Administrasi_Guru.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // WhatsApp share message
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*Aplikasi Administrasi Guru - ${school.name}*\n` +
      `Tahun Ajaran ${school.academicYear}\n\n` +
      `Bapak/Ibu Guru dapat mengakses portal administrasi kelas, jurnal mengajar, presensi, dan penilaian melalui tautan berikut:\n` +
      `${currentUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Telegram share
  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `Aplikasi Administrasi Guru ${school.name} (T.A. ${school.academicYear})`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${text}`, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-lg">
                <Share2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold">Bagikan Link & Barcode (QR Code)</h3>
                <p className="text-xs text-slate-300">Akses mudah untuk rekan guru, staf, atau siswa</p>
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

          <div className="p-6 space-y-6">
            {/* Target Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Pilih Halaman yang Ingin Dibagikan:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTarget('app')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedTarget === 'app'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Portal Utama
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTarget('schedule')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedTarget === 'schedule'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Jadwal Mengajar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTarget('grades')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedTarget === 'grades'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Rekap Nilai
                </button>
              </div>
            </div>

            {/* QR Code Showcase Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-[190px] max-h-[190px] w-full h-auto" />
              </div>

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    <QrCode className="w-3.5 h-3.5" /> Barcode Otomatis
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">Scan untuk Membuka</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Arahkan kamera HP Android atau iPhone untuk langsung mengakses aplikasi tanpa mengetik alamat web.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Gambar QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintPosterOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Lembar QR
                  </button>
                </div>
              </div>
            </div>

            {/* Link Copy Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Tautan / Link Langsung:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Salin Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct Social / Messenger Sharing */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-2.5">Kirim Cepat ke Media Komunikasi:</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Kirim via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4 text-sky-600" />
                  Kirim via Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT LEMBAR QR CODE / STANDEE RESMI MODAL */}
      <PrintDocumentModal
        isOpen={isPrintPosterOpen}
        onClose={() => setIsPrintPosterOpen(false)}
        title="LEMBAR AKSES APLIKASI ADMINISTRASI GURU"
        subtitle={`Scan Barcode (QR Code) untuk Membuka Aplikasi · ${school.name}`}
        school={school}
        currentUser={currentUser}
        metaInfo={[
          { label: 'Satuan Pendidikan', value: school.name },
          { label: 'Tahun Pelajaran', value: school.academicYear },
          { label: 'Peruntukan', value: 'Pendidik & Tenaga Kependidikan' },
          { label: 'Portal Web', value: currentUrl },
        ]}
      >
        <div className="my-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl inline-block shadow-sm">
            {/* Render a larger canvas clone for high-res printing */}
            <img
              src={canvasRef.current ? canvasRef.current.toDataURL('image/png') : ''}
              alt="QR Code Aplikasi"
              className="w-64 h-64 mx-auto object-contain"
            />
          </div>

          <div className="max-w-md space-y-1">
            <h4 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              PETUNJUK PENGGUNAAN
            </h4>
            <ol className="text-xs text-slate-700 list-decimal list-inside text-left space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <li>Buka aplikasi Kamera atau Pemindai QR pada ponsel cerdas Anda.</li>
              <li>Arahkan lensa kamera ke gambar barcode di atas.</li>
              <li>Klik tautan atau notifikasi yang muncul di layar untuk langsung masuk ke aplikasi.</li>
              <li>Simpan tautan sebagai bookmark atau pasang di layar utama ponsel untuk akses cepat harian.</li>
            </ol>
          </div>
        </div>
      </PrintDocumentModal>
    </>
  );
};
