import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCRIPT,
  isSupabaseConfigured,
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredSupabaseConfig();
      if (cfg) {
        setUrl(cfg.url);
        setAnonKey(cfg.anonKey);
      }
      setIsConnected(isSupabaseConfigured());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setStatusMessage({
        type: 'error',
        text: 'URL Supabase dan Anon Key wajib diisi.',
      });
      return;
    }

    setIsTesting(true);
    const result = await testSupabaseConnection(cleanUrl, cleanKey);
    setIsTesting(false);

    if (result.success) {
      saveStoredSupabaseConfig(cleanUrl, cleanKey);
      setIsConnected(true);
      setStatusMessage({
        type: result.tableReady ? 'success' : 'warning',
        text: result.message,
      });
      if (onConnectionChanged) {
        onConnectionChanged();
      }
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message,
      });
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Yakin ingin memutuskan koneksi Supabase? Data akan kembali menggunakan penyimpanan lokal.')) {
      clearStoredSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setIsConnected(false);
      setStatusMessage({
        type: 'warning',
        text: 'Koneksi Supabase diputuskan. Aplikasi saat ini menggunakan penyimpanan lokal.',
      });
      if (onConnectionChanged) {
        onConnectionChanged();
      }
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
      setHasCopiedSql(true);
      setTimeout(() => setHasCopiedSql(false), 2500);
    } catch {
      alert('Gagal menyalin otomatis. Silakan pilih dan salin teks SQL secara manual.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-[#D8B744] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-tight">
                Koneksi Database Supabase
              </h3>
              <p className="text-[11px] text-stone-500">
                Semua proyek & galeri akan tersimpan langsung di Supabase Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status badge */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-stone-50">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-400'
                }`}
              />
              <span className="font-semibold text-stone-800">
                {isConnected ? 'Supabase Terhubung' : 'Belum Terhubung'}
              </span>
            </div>
            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] font-medium text-rose-600 hover:text-rose-800 transition-colors"
              >
                Putuskan
              </button>
            )}
          </div>

          {/* Feedback message banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusMessage.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : statusMessage.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span className="text-[11px] leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Project URL Supabase *
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzabcdefghijklm.supabase.co"
                required
                className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 focus:bg-white transition-all"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Temukan di Dashboard Supabase &gt; Project Settings &gt; API &gt; Project URL
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                API Key (Anon / Public) *
              </label>
              <textarea
                rows={3}
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                required
                className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 focus:bg-white transition-all break-all"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Temukan di Dashboard Supabase &gt; Project Settings &gt; API &gt; Project API keys (anon public)
              </span>
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D8B744]" />
                  <span>Menguji Koneksi & Menyimpan...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D8B744]" />
                  <span>Uji & Simpan Koneksi Supabase</span>
                </>
              )}
            </button>
          </form>

          {/* SQL Schema Section */}
          <div className="pt-3 border-t border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-stone-600" />
                Skrip SQL Schema & RLS Supabase
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-medium text-[10px] transition-colors"
              >
                {hasCopiedSql ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-stone-500" />
                    <span>Salin SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-stone-500 mb-2 leading-relaxed">
              Jalankan skrip ini sekali di <strong>SQL Editor</strong> Supabase Anda. Skrip ini membuat tabel <code>projects</code>, <code>galleries</code>, storage bucket <code>wedding-media</code>, dan mengaktifkan RLS agar semua CRUD dapat disimpan tanpa hambatan.
            </p>

            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="text-[11px] text-stone-600 hover:text-stone-900 underline underline-offset-2 mb-2 block"
            >
              {showSqlPreview ? 'Sembunyikan Cuplikan SQL' : 'Lihat Cuplikan SQL'}
            </button>

            {showSqlPreview && (
              <div className="relative">
                <pre className="p-3 bg-stone-900 text-stone-200 rounded-lg text-[10px] font-mono max-h-48 overflow-y-auto leading-relaxed border border-stone-800">
                  {SUPABASE_SQL_SCRIPT}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
