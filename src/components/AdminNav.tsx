import React from 'react';
import { Camera, LogOut, Sparkles } from 'lucide-react';
import { AdminUser } from '../types';

interface AdminNavProps {
  user: AdminUser | null;
  onLogout: () => void;
  onOpenBrandSettings?: () => void;
  onNewProject: () => void;
  activeView: 'dashboard' | 'editor' | 'preview';
  onNavigateDashboard: () => void;
}

export const AdminNav: React.FC<AdminNavProps> = ({
  user,
  onLogout,
  onOpenBrandSettings,
  onNewProject,
  activeView,
  onNavigateDashboard,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onNavigateDashboard}
            className="flex items-center gap-2 text-left group focus:outline-none rounded-sm"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs group-hover:bg-[#C29D29] transition-colors">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-stone-100" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-wider text-stone-900 block leading-tight">
                POLA FRAME
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 block -mt-0.5">
                PHOTOBOOT WEDDING
              </span>
            </div>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Brand Settings Button */}
          {onOpenBrandSettings && (
            <button
              onClick={onOpenBrandSettings}
              title="Pengaturan Brand Studio Default"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
            >
              <span className="hidden sm:inline">Brand Studio</span>
              <span className="sm:hidden">Brand</span>
            </button>
          )}

          {/* New Project Button */}
          {activeView === 'dashboard' && (
            <button
              onClick={onNewProject}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-[11px] sm:text-xs md:text-sm font-medium rounded-md shadow-2xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D8B744]" />
              <span>Buat Proyek</span>
            </button>
          )}

          {/* User & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-stone-200">
            <span
              className="text-xs text-stone-500 hidden md:inline max-w-[140px] truncate"
              title={user?.email}
            >
              {user?.email}
            </span>
            <button
              onClick={onLogout}
              title="Keluar dari Admin"
              className="p-1 sm:p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
