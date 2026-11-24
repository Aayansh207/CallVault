import React, { useState } from 'react';
import {
  FolderOpen,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Users,
  Clock,
  Mic2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/ipc';
import { formatHoursMinutes } from '../../lib/formatters';

export function OnboardingView({ onComplete }) {
  const { scanningState, startScan, updateSetting, stats, fetchStats } = useApp();
  const [error, setError] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleChooseFolder = async () => {
    setError(null);
    setIsSelecting(true);
    try {
      const selected = await api.settings.chooseFolder();
      if (!selected) {
        setIsSelecting(false);
        return;
      }
      await updateSetting('recording_folder', selected);
      // Start initial scan
      await startScan(selected);
    } catch (err) {
      setError(err.message || 'Failed to scan selected folder');
    } finally {
      setIsSelecting(false);
    }
  };

  const percent =
    scanningState.total > 0
      ? Math.min(100, Math.round((scanningState.scanned / scanningState.total) * 100))
      : 0;

  return (
    <div className="welcome-screen">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="welcome-card">
        <div className="welcome-brand">CallVault</div>
        <div className="welcome-symbol">
          <ShieldCheck className="w-9 h-9" />
        </div>

        {['idle', 'error'].includes(scanningState.phase) && (
          <>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Your call archive</h1>
            <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Choose a folder of recordings to start your private, searchable library.
            </p>

            {error && (
              <div className="p-3 mb-6 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleChooseFolder}
              disabled={isSelecting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center space-x-2.5 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <FolderOpen className="w-5 h-5" />
              <span>{isSelecting ? 'Selecting...' : 'Choose Recording Folder'}</span>
            </button>

            <button className="welcome-skip" type="button" onClick={onComplete}>Browse the library</button>
          </>
        )}

        {(scanningState.phase === 'discovering' || scanningState.phase === 'indexing') && (
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">
              {scanningState.phase === 'discovering' ? 'Discovering recordings...' : 'Indexing recordings...'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Please keep the recording folder accessible while CallVault indexes your library.
            </p>

            <div className="flex justify-between text-xs font-mono text-slate-300 mb-2">
              <span>{scanningState.scanned.toLocaleString()} / {scanningState.total.toLocaleString()}</span>
              <span>{percent}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-vault-950 rounded-full overflow-hidden p-0.5 border border-vault-800 mb-4">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-150"
                style={{ width: `${percent}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 truncate font-mono text-left px-1">
              {scanningState.currentFile || 'Scanning files...'}
            </p>
          </div>
        )}

        {scanningState.phase === 'complete' && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-1">Indexing Complete!</h2>
            <p className="text-xs text-slate-400 mb-6">
              Your call library is ready for instant search and playback.
            </p>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-vault-950 rounded-2xl border border-vault-800">
                <Mic2 className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <span className="block font-mono text-base font-bold text-slate-100">
                  {stats.total_recordings || scanningState.total}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Recordings</span>
              </div>

              <div className="p-3 bg-vault-950 rounded-2xl border border-vault-800">
                <Users className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <span className="block font-mono text-base font-bold text-slate-100">
                  {stats.total_people || 0}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">People</span>
              </div>

              <div className="p-3 bg-vault-950 rounded-2xl border border-vault-800">
                <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="block font-mono text-base font-bold text-slate-100">
                  {formatHoursMinutes(stats.total_duration_seconds)}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Time</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onComplete}
              className="w-full py-3.5 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-xl shadow-sky-500/20 transition transform hover:scale-[1.01]"
            >
              Open Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
