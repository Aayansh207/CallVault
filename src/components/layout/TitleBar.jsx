import React from 'react';
import { Search, Settings as SettingsIcon, ShieldCheck, FolderSync } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export function TitleBar({ searchQuery, onSearchChange }) {
  const navigate = useNavigate();
  const { scanningState } = useApp();

  return (
    <header className="h-13 min-h-[3.25rem] flex-shrink-0 bg-vault-950/95 border-b border-vault-850/80 flex items-center justify-between px-4 select-none relative z-30 drag-region backdrop-blur-md">
      {/* Left: macOS traffic lights spacer + Branding */}
      <div className="flex items-center space-x-3.5 no-drag-region">
        {/* Spacer for macOS traffic lights on left */}
        <div className="w-16 flex-shrink-0" />

        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-wide text-slate-100 flex items-center space-x-1.5">
            <span>CallVault</span>
            <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded-md bg-sky-950 text-sky-400 border border-sky-800/60">
              LOCAL
            </span>
          </span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-lg mx-6 no-drag-region">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, number, notes, or date (e.g. October 6)..."
            className="w-full bg-vault-900 border border-vault-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2.5 no-drag-region">
        {scanningState.isScanning && (
          <div className="flex items-center space-x-2 text-xs text-sky-400 bg-sky-950/60 border border-sky-800/60 px-3 py-1 rounded-full animate-pulse">
            <FolderSync className="w-3.5 h-3.5 animate-spin" />
            <span className="font-medium text-[11px]">Indexing...</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-vault-900 border border-transparent hover:border-vault-800 transition"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

