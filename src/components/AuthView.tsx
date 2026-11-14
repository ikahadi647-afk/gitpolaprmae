import React, { useState } from 'react';
import { Camera, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { signInAdmin, signUpAdmin } from '../lib/dataService';
import { AdminUser } from '../types';

interface AuthViewProps {
  onSuccess: (user: AdminUser) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    if (isSignUp) {
      const res = await signUpAdmin(email, password);
      setIsLoading(false);
      if (res.user) {
        onSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Pendaftaran gagal');
      }
    } else {
      const res = await signInAdmin(email, password);
      setIsLoading(false);
      if (res.user) {
        onSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Email atau kata sandi tidak valid');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4 selection:bg-[#D4AF37]/20 relative">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-stone-900 text-[#D8B744] items-center justify-center shadow-md mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-stone-900">
            MAHLIGAI
          </h1>
          <p className="text-xs uppercase tracking-widest text-stone-500 mt-1">
            Portal Admin Galeri Foto Pengantin
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              {isSignUp ? 'Daftar Akun Pengelola' : 'Masuk ke Dashboard'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {isSignUp
                ? 'Buat akun admin untuk mulai mengelola portofolio galeri foto pengantin'
                : 'Masuk dengan akun terdaftar untuk mengelola proyek dan galeri foto'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@studio.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Memproses...' : isSignUp ? 'Daftar Sekarang' : 'Masuk ke Dashboard'}</span>
              <ArrowRight className="w-4 h-4 text-[#D8B744]" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="text-stone-600 hover:text-stone-900 font-medium underline underline-offset-2"
            >
              {isSignUp ? 'Sudah memiliki akun? Masuk' : 'Belum memiliki akun? Daftar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
