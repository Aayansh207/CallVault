import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, FileText, FolderSync, GitMerge, Mic2, Settings, Star, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Sidebar() {
  const { stats, scanningState, startScan, settings, openMergeModal } = useApp();
  const { search } = useLocation();
  const notes = new URLSearchParams(search).get('filter') === 'notes';
  const navItems = [
    { to: '/', label: 'Recordings', icon: Mic2, count: stats.total_recordings },
    { to: '/timeline', label: 'Timeline', icon: CalendarDays },
    { to: '/people', label: 'People', icon: Users, count: stats.total_people },
    { to: '/favorites', label: 'Favorites', icon: Star, count: stats.total_favorites },
    { to: '/?filter=notes', label: 'With notes', icon: FileText, count: stats.total_with_notes, notes: true },
  ];

  return (
    <aside className="app-sidebar">
      <nav aria-label="Library">
        <h2 className="nav-caption">Library</h2>
        {navItems.map(({ to, label, icon: Icon, count, notes: isNotes }) => (
          <NavLink
            key={to}
            to={to}
            end
            title={label}
            className={({ isActive }) => `side-link ${isActive && ((to === '/' || isNotes) ? Boolean(isNotes) === notes : true) ? 'selected' : ''}`}
            aria-current={(to === '/' && notes) || (isNotes && !notes) ? false : 'page'}
          >
            <Icon />
            <span className="side-label">{label}</span>
            {count > 0 && <span className="side-count">{count.toLocaleString()}</span>}
          </NavLink>
        ))}
        <h2 className="nav-caption nav-section">Tools</h2>
        <button type="button" className="side-link" title="Merge contacts" onClick={() => openMergeModal()}>
          <GitMerge /><span className="side-label">Merge contacts</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <button
          type="button"
          className="side-link"
          title="Rescan folder"
          disabled={scanningState.isScanning || !settings.recording_folder}
          onClick={() => startScan(settings.recording_folder).catch(console.error)}
        >
          <FolderSync className={scanningState.isScanning ? 'animate-spin' : ''} />
          <span className="side-label">{scanningState.isScanning ? 'Scanning…' : 'Rescan folder'}</span>
        </button>
        <NavLink to="/settings" title="Settings" className={({ isActive }) => `side-link ${isActive ? 'selected' : ''}`}>
          <Settings /><span className="side-label">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
