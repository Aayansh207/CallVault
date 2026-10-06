import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  FolderSync,
  Database,
  Volume2,
  HardDrive,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/ipc';

export function SettingsView() {
  const { settings, updateSetting, startScan, scanningState, refreshData } = useApp();
  const [dbPath, setDbPath] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    async function loadDbPath() {
      const p = await api.settings.getDatabasePath();
      if (p) setDbPath(p);
    }
    loadDbPath();
  }, []);

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleChooseFolder = async () => {
    const selected = await api.settings.chooseFolder();
    if (selected) {
      await updateSetting('recording_folder', selected);
      showFeedback('Recording folder updated');
      startScan(selected);
    }
  };

  const handleRescan = async (forceFull = false) => {
    if (!settings.recording_folder) return;
    try {
      await startScan(settings.recording_folder, { forceFullRescan: forceFull });
      showFeedback(forceFull ? 'Full library index rebuilt' : 'Incremental scan finished');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJson = async () => {
    try {
      const recordings = await api.recordings.list();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(recordings, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `callvault_index_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showFeedback('Metadata exported as JSON');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-vault-950">
      {/* Header */}
      <div className="px-8 pt-7 pb-5 border-b border-vault-850/80 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
          <span>Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage local recording folders, playback defaults, and database maintenance
        </p>
      </div>

      {feedbackMsg && (
        <div className="mx-8 mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center space-x-2 animate-modal">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Settings Sections */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 max-w-4xl">
        {/* Section 1: General & Folder */}
        <section className="bg-vault-900/60 border border-vault-800/80 rounded-2xl p-6">
          <div className="flex items-center space-x-2.5 mb-4">
            <FolderOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold text-slate-100">Recording Storage</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Current Recording Folder:
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  readOnly
                  value={settings.recording_folder || 'No folder configured'}
                  className="flex-1 bg-vault-950 border border-vault-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleChooseFolder}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition"
                >
                  Change Folder
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                CallVault scans this folder recursively for .m4a recordings.
              </p>
            </div>

            <div className="pt-3 border-t border-vault-800/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Automatically Watch Folder</h4>
                <p className="text-[11px] text-slate-400">
                  Detect and index new, modified, or deleted recordings in real time.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_scan === 'true'}
                onChange={(e) => updateSetting('auto_scan', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Player Preferences */}
        <section className="bg-vault-900/60 border border-vault-800/80 rounded-2xl p-6">
          <div className="flex items-center space-x-2.5 mb-4">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">Player Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Default Playback Speed
              </label>
              <select
                value={settings.default_playback_speed || '1.0'}
                onChange={(e) => updateSetting('default_playback_speed', e.target.value)}
                className="w-full bg-vault-950 border border-vault-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="0.75">0.75×</option>
                <option value="1.0">1.0× (Normal)</option>
                <option value="1.25">1.25×</option>
                <option value="1.5">1.5×</option>
                <option value="2.0">2.0×</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Skip Backward Interval
              </label>
              <select
                value={settings.skip_backward_seconds || '15'}
                onChange={(e) => updateSetting('skip_backward_seconds', e.target.value)}
                className="w-full bg-vault-950 border border-vault-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="15">15 seconds</option>
                <option value="30">30 seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Skip Forward Interval
              </label>
              <select
                value={settings.skip_forward_seconds || '30'}
                onChange={(e) => updateSetting('skip_forward_seconds', e.target.value)}
                className="w-full bg-vault-950 border border-vault-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="15">15 seconds</option>
                <option value="30">30 seconds</option>
                <option value="45">45 seconds</option>
                <option value="60">60 seconds</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Database & Maintenance */}
        <section className="bg-vault-900/60 border border-vault-800/80 rounded-2xl p-6">
          <div className="flex items-center space-x-2.5 mb-4">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">Database & Maintenance</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                SQLite Database Location:
              </label>
              <p className="text-xs font-mono text-slate-400 bg-vault-950 border border-vault-800/80 p-2.5 rounded-xl break-all">
                {dbPath || 'Loading...'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Only index metadata is stored here. Your original .m4a audio recordings are never modified.
              </p>
            </div>

            <div className="pt-3 border-t border-vault-800/60 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleRescan(false)}
                disabled={scanningState.isScanning || !settings.recording_folder}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-vault-800 hover:bg-vault-750 text-slate-200 text-xs font-medium transition border border-vault-700/60 disabled:opacity-50"
              >
                <FolderSync className="w-3.5 h-3.5" />
                <span>Incremental Rescan</span>
              </button>

              <button
                type="button"
                onClick={() => handleRescan(true)}
                disabled={scanningState.isScanning || !settings.recording_folder}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 text-amber-300 text-xs font-medium transition border border-amber-800/60 disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Rebuild Entire Index</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-vault-800 hover:bg-vault-750 text-slate-200 text-xs font-medium transition border border-vault-700/60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Metadata JSON</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Privacy & Security Guarantee */}
        <section className="bg-sky-950/20 border border-sky-900/40 rounded-2xl p-6 flex items-start space-x-4">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-sky-300">Privacy & Security Guarantee</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              CallVault is local-first. All recordings, database files, and metadata remain strictly on your computer.
              No cloud accounts, no audio uploading, no tracking telemetry, and no remote dependencies.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
