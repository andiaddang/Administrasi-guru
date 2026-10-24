import React from 'react';
import { SchoolProfile, User } from '../types';
import { Printer, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Modal Toolbar - Hidden during Print */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-100 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Pratinjau Dokumen Cetak Resmi</h3>
            <p className="text-xs text-slate-500">Kop surat dan tanda tangan otomatis disesuaikan dari Pengaturan Sekolah</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Area */}
        <div className="p-8 sm:p-10 print:p-0 bg-white min-h-[600px] text-slate-900">
          {/* KOP SURAT RESMI */}
          <div className="border-kop-dinas pb-3 mb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Logo Kiri */}
              <div
                className="flex-shrink-0 flex items-center justify-center"
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
                className="flex-shrink-0 flex items-center justify-center"
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
  );
};
