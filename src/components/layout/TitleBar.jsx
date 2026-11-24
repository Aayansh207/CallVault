import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, FolderSync, Search, X, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

export function TitleBar({ searchQuery, onSearchChange }) {
  const [draft, setDraft] = useState(searchQuery);
  const { theme, setTheme } = useTheme();
  const search = useRef(null);
  const { scanningState } = useApp();

  useEffect(() => {
    const query = draft.trim();
    if (query === searchQuery) return;
    const timer = setTimeout(() => onSearchChange(query), query ? 150 : 0);
    return () => clearTimeout(timer);
  }, [draft, onSearchChange, searchQuery]);

  useEffect(() => {
    function focusSearch(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        search.current?.focus();
        search.current?.select();
      }
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  return (
    <header className="app-titlebar drag-region" data-mac={navigator.platform.includes('Mac')}>
      <div className="app-brand">
        <span className="brand-icon"><AudioLines /></span>
        <span>CallVault</span>
      </div>
      <form
        role="search"
        className="global-search no-drag-region"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchChange(draft.trim());
        }}
      >
        <Search aria-hidden="true" />
        <input
          ref={search}
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setDraft('');
              onSearchChange('');
            }
          }}
          placeholder="Search calls, notes, tags, or dates"
          aria-label="Search recordings"
          maxLength={240}
        />
        {draft ? (
          <button type="button" className="icon-button" aria-label="Clear search" onClick={() => {
            setDraft('');
            onSearchChange('');
            search.current?.focus();
          }}><X /></button>
        ) : <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'}K</kbd>}
      </form>
      <div className="title-tools no-drag-region">
        <div className="mode-switch" aria-label="Appearance">
          {[['system', Monitor], ['light', Sun], ['dark', Moon]].map(([mode, Icon]) => (
            <button key={mode} type="button" aria-label={mode + ' theme'} title={mode + ' theme'} aria-pressed={theme === mode} onClick={() => setTheme(mode)}><Icon /></button>
          ))}
        </div>
        <div className="indexing-status" role="status">
          {scanningState.isScanning && <><FolderSync className="animate-spin" /><span>Indexing</span></>}
        </div>
      </div>
    </header>
  );
}
