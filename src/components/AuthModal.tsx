import React, { useState } from 'react';
import { User, SchoolProfile } from '../types';
import { StorageService } from '../services/storageService';
import { LogIn, UserPlus, KeyRound, Mail, UserCheck, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../firebase';
import { FirestoreSyncService } from '../services/firestoreSync';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: User) => void;
  school: SchoolProfile;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  school,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('andiismail05@guru.sma.belajar.id');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [subject, setSubject] = useState('Matematika & Informatika');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const accounts = StorageService.getAccounts();
    const found = accounts.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase() && acc.passwordHash === password
    );

    if (found) {
      const user: User = {
        id: found.id,
        name: found.name,
        email: found.email,
        nip: found.nip,
        subject: found.subject,
        role: found.role,
        avatar: found.avatar,
      };
      StorageService.saveCurrentUser(user);
      onLoginSuccess(user);
      if (onClose) onClose();
    } else {
      setError('Email atau kata sandi tidak cocok. Gunakan akun demo atau daftar akun baru.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Harap isi seluruh field yang wajib diisi.');
      return;
    }

    const accounts = StorageService.getAccounts();
    const existing = accounts.find((acc) => acc.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      setError('Email ini sudah terdaftar. Silakan login.');
      return;
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      nip: nip.trim() || '-',
      subject: subject.trim() || 'Guru Mata Pelajaran',
      role: 'Guru Pengampu',
      passwordHash: password,
    };

    StorageService.saveAccounts([...accounts, newUser]);

    const userObj: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      nip: newUser.nip,
      subject: newUser.subject,
      role: newUser.role,
    };
    StorageService.saveCurrentUser(userObj);
    onLoginSuccess(userObj);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            {school.logoKanan ? (
              <img
                src={school.logoKanan}
                alt="Logo Sekolah"
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">{school.name}</h2>
          <p className="text-xs text-slate-300 mt-1">Sistem Administrasi Guru Terpadu</p>

          <div className="flex bg-slate-800/80 p-1 rounded-lg mt-5 border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Daftar Guru Baru
            </button>
          </div>
        </div>

        {/* Content Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Akun Pembelajaran / Dinas
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@guru.sma.belajar.id"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kata Sandi</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk ke Aplikasi
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('andiismail05@guru.sma.belajar.id');
                    setPassword('123456');
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Isi Otomatis Akun Default (Andi Ismail, S.Pd.)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dra. Sitti Rahmah, M.Pd."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  NIP / NUPTK (Opsional)
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="19850101 201001 2 001"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mata Pelajaran yang Diampu *
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Matematika / Bahasa Indonesia / Fisika"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Aktif *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@guru.sma.belajar.id"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kata Sandi Baru *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Daftarkan Akun Guru
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
