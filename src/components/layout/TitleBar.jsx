import React from 'react';
import { Search, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export function TitleBar({ searchQuery, onSearchChange }) {
  const navigate = useNavigate();
  const { scanningState } = useApp();

  return (
    <header className="h-12 bg-vault-950 border-b border-vault-850/80 flex items-center justify-between px-4 select-none relative z-10 [app-region:drag]">
      {/* Spacer for macOS traffic lights on left */}
      <div className="w-20 pl-2"></div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-4 [app-region:no-drag]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone number, or filename..."
            className="w-full bg-vault-900 border border-vault-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
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
      <div className="flex items-center space-x-2 [app-region:no-drag]">
        {scanningState.isScanning && (
          <div className="flex items-center space-x-2 text-xs text-sky-400 bg-sky-950/40 border border-sky-800/50 px-2.5 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Indexing...</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-vault-900 transition"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
