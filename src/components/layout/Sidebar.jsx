import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Mic2,
  Calendar,
  Users,
  Star,
  Settings,
  FolderSync,
  FileText,
  ShieldCheck,
  GitMerge,
} from 'lucide-react';

import { useApp } from '../../context/AppContext';

export function Sidebar() {
  const { stats, scanningState, startScan, settings, openMergeModal } = useApp();

  const navItems = [
    {
      to: '/',
      label: 'All Recordings',
      icon: Mic2,
      count: stats.total_recordings,
    },
    {
      to: '/timeline',
      label: 'Timeline',
      icon: Calendar,
    },
    {
      to: '/people',
      label: 'People',
      icon: Users,
      count: stats.total_people,
    },
    {
      to: '/favorites',
      label: 'Favorites',
      icon: Star,
      count: stats.total_favorites,
    },
  ];

  return (
    <aside className="w-64 bg-vault-950 border-r border-vault-850 flex flex-col justify-between select-none h-full flex-shrink-0">
      {/* Navigation */}
      <div className="py-4">
        {/* Main Navigation */}
        <div className="px-3">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Library
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 font-semibold shadow-sm border border-sky-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-vault-900 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-vault-850 text-slate-400">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Insights Section */}
        <div className="px-3 pt-5">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Insights
          </p>
          <NavLink
            to="/?filter=notes"
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-vault-900 border border-transparent'
              }`
            }
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>Recordings with Notes</span>
            </div>
            {stats.total_with_notes > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-400 border border-sky-800/50">
                {stats.total_with_notes}
              </span>
            )}
          </NavLink>
        </div>

        {/* Tools Section */}
        <div className="px-3 pt-5">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Tools
          </p>
          <button
            type="button"
            onClick={() => openMergeModal(null)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-sky-300 hover:bg-vault-900 border border-transparent hover:border-vault-800 transition text-left"
          >
            <div className="flex items-center space-x-3">
              <GitMerge className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>Merge Contacts</span>
            </div>
          </button>
        </div>
      </div>


      {/* Bottom Section */}
      <div className="p-3 border-t border-vault-850/80 space-y-1">
        {/* Quick Rescan */}
        <button
          type="button"
          onClick={() => startScan(settings.recording_folder)}
          disabled={scanningState.isScanning || !settings.recording_folder}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-vault-900 transition disabled:opacity-50"
        >
          <FolderSync
            className={`w-4 h-4 ${scanningState.isScanning ? 'animate-spin text-sky-400' : ''}`}
          />
          <span>{scanningState.isScanning ? 'Scanning...' : 'Rescan Folder'}</span>
        </button>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
              isActive
                ? 'bg-sky-500/15 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-vault-900'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
