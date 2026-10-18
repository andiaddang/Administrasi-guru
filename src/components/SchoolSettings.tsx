import React, { useState } from 'react';
import { SchoolProfile } from '../types';
import {
  Building,
  Save,
  Upload,
  RotateCcw,
  CheckCircle,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { DEFAULT_SCHOOL, DEFAULT_LOGO_KIRI, DEFAULT_LOGO_KANAN } from '../data/initialData';

interface SchoolSettingsProps {
  school: SchoolProfile;
  onSaveSchool: (profile: SchoolProfile) => void;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({ school, onSaveSchool }) => {
  const [formData, setFormData] = useState<SchoolProfile>({ ...school });
  const [successMsg, setSuccessMsg] = useState(false);

  const handleChange = (field: keyof SchoolProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoKiri' | 'logoKanan'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleChange(field, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetKop = () => {
    if (window.confirm('Kembalikan kop surat dan profil ke default SMAN 1 Gowa?')) {
      setFormData({ ...DEFAULT_SCHOOL });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchool(formData);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pengaturan Profil Sekolah & Kop Surat Resmi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas satuan pendidikan, kepala sekolah, dan template kop dinas cetak
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleResetKop}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Profil sekolah dan kop surat resmi berhasil disimpan! Kop baru akan diterapkan otomatis pada setiap dokumen rapor, presensi, dan jurnal yang dicetak.
          </span>
        </div>
      )}

      {/* LIVE PREVIEW KOP SURAT */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pratinjau Langsung (Live Preview) Kop Surat Dinas
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Ukuran Standar Kertas Cetak A4</span>
        </div>

        {/* The Kop Box */}
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-300">
          <div className="border-kop-dinas pb-3">
            <div className="flex items-center justify-between gap-4">
              {/* Logo Kiri */}
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-white rounded border border-slate-200 p-1">
                {formData.logoKiri ? (
                  <img
                    src={formData.logoKiri}
                    alt="Logo Kiri"
                    className="max-h-18 max-w-18 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">Logo 1</span>
                )}
              </div>

              {/* Text Center */}
              <div className="flex-1 text-center font-serif leading-tight">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                  {formData.kopHeader1 || 'PEMERINTAH PROVINSI SULAWESI SELATAN'}
                </h4>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                  {formData.kopHeader2 || 'DINAS PENDIDIKAN'}
                </h4>
                {formData.kopHeader3 && (
                  <h4 className="text-xs sm:text-sm font-medium uppercase text-slate-900">
                    {formData.kopHeader3}
                  </h4>
                )}
                <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-950 mt-0.5">
                  {formData.kopHeader4 || formData.name || 'UPT SMA NEGERI 1 GOWA'}
                </h2>
                <p className="text-[10px] sm:text-[11px] font-sans text-slate-700 mt-1">
                  {formData.kopSubheader || formData.address}
                </p>
                <p className="text-[9px] sm:text-[10px] font-sans text-slate-600">
                  {formData.kopContact || `Telp: ${formData.phone} · Website: ${formData.website}`}
                </p>
              </div>

              {/* Logo Kanan */}
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-white rounded border border-slate-200 p-1">
                {formData.logoKanan ? (
                  <img
                    src={formData.logoKanan}
                    alt="Logo Kanan"
                    className="max-h-18 max-w-18 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">Logo 2</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: KOP SURAT SETTINGS */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Pengaturan Teks & Logo Kop Surat</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo Kiri Uploader */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Logo Kiri (Pemda / Pemprov / Tut Wuri)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white border border-slate-300 rounded flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logoKiri ? (
                    <img
                      src={formData.logoKiri}
                      alt="Logo Kiri"
                      className="w-12 h-12 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File Gambar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logoKiri')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={formData.logoKiri}
                    onChange={(e) => handleChange('logoKiri', e.target.value)}
                    placeholder="Atau tempel URL gambar..."
                    className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Logo Kanan Uploader */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Logo Kanan (Logo Sekolah SMAN 1 Gowa)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white border border-slate-300 rounded flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logoKanan ? (
                    <img
                      src={formData.logoKanan}
                      alt="Logo Kanan"
                      className="w-12 h-12 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File Gambar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logoKanan')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={formData.logoKanan}
                    onChange={(e) => handleChange('logoKanan', e.target.value)}
                    placeholder="Atau tempel URL gambar..."
                    className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Header Baris 1 (Pemerintah / Yayasan)
              </label>
              <input
                type="text"
                value={formData.kopHeader1}
                onChange={(e) => handleChange('kopHeader1', e.target.value)}
                placeholder="PEMERINTAH PROVINSI SULAWESI SELATAN"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Header Baris 2 (Dinas Terkait)
              </label>
              <input
                type="text"
                value={formData.kopHeader2}
                onChange={(e) => handleChange('kopHeader2', e.target.value)}
                placeholder="DINAS PENDIDIKAN"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Header Baris 3 (Cabang Dinas / Wilayah)
              </label>
              <input
                type="text"
                value={formData.kopHeader3}
                onChange={(e) => handleChange('kopHeader3', e.target.value)}
                placeholder="CABANG DINAS PENDIDIKAN WILAYAH II (GOWA - TAKALAR)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Header Baris 4 (Nama Lembaga / Satuan Pendidikan) *
              </label>
              <input
                type="text"
                required
                value={formData.kopHeader4}
                onChange={(e) => handleChange('kopHeader4', e.target.value)}
                placeholder="UPT SMA NEGERI 1 GOWA"
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Subheader Alamat Lengkap
              </label>
              <input
                type="text"
                value={formData.kopSubheader}
                onChange={(e) => handleChange('kopSubheader', e.target.value)}
                placeholder="Jalan Andi Mallombasang No.1 A, Tombolo, Kec. Somba Opu, Kab. Gowa 92111"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kontak, Telepon, Pos-el & Laman Resmi
              </label>
              <input
                type="text"
                value={formData.kopContact}
                onChange={(e) => handleChange('kopContact', e.target.value)}
                placeholder="Telepon: (0411) 861234 | Laman: sman1gowa.sch.id | Pos-el: info@sman1gowa.sch.id"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: IDENTITAS SATUAN PENDIDIKAN */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Identitas Sekolah & Kepala Sekolah
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nama Satuan Pendidikan *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">NPSN</label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => handleChange('npsn', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Alamat Lengkap</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Provinsi</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Kode Pos</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tahun Pelajaran</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Semester Aktif</label>
              <select
                value={formData.semester}
                onChange={(e) => handleChange('semester', e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Nama Lengkap Kepala Sekolah & Gelar *
              </label>
              <input
                type="text"
                required
                value={formData.headmaster}
                onChange={(e) => handleChange('headmaster', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={formData.headmasterNip}
                onChange={(e) => handleChange('headmasterNip', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              Simpan Seluruh Pengaturan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
