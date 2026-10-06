import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Mic2,
  Calendar,
  Users,
  Star,
  Settings,
  FolderSync,
  Tag as TagIcon,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Sidebar({ onOpenNewTag }) {
  const { stats, tags, selectedTag, setSelectedTag, scanningState, startScan, settings } = useApp();

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
    <aside className="w-64 bg-vault-950 border-r border-vault-850 flex flex-col justify-between select-none h-full">
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-vault-850/60 pt-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-slate-100 flex items-center space-x-1.5">
                <span>CallVault</span>
              </span>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Personal Vault
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="px-3 py-5">
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
                        ? 'bg-sky-500/15 text-sky-400 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-vault-900'
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

        {/* Collections / Tags */}
        <div className="px-3 pt-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Collections
            </p>
            <button
              type="button"
              onClick={onOpenNewTag}
              className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-vault-850 transition"
              title="New Tag"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {tags.map((tag) => {
              const isSelected = selectedTag === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? null : tag.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isSelected
                      ? 'bg-indigo-500/15 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-vault-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="truncate">{tag.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
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
