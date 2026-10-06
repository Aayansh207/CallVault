import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { MiniPlayer } from '../player/MiniPlayer';
import { FullPlayerModal } from '../player/FullPlayerModal';
import { NoteModal } from '../recordings/NoteModal';
import { TagModal } from '../recordings/TagModal';
import { DeleteConfirmModal } from '../recordings/DeleteConfirmModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useApp } from '../../context/AppContext';

export function AppShell({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const { refreshData } = useApp();

  // Active modals
  const [activeNoteRecording, setActiveNoteRecording] = useState(null);
  const [activeTagRecording, setActiveTagRecording] = useState(null);
  const [activeDeleteRecording, setActiveDeleteRecording] = useState(null);
  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // If user searches while not in Library, navigate back to library
    if (query && window.location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-vault-950 text-slate-100 select-none">
      {/* Title Bar */}
      <TitleBar searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenNewTag={() => setIsNewTagModalOpen(true)} />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-vault-950">
          <Outlet />
        </main>
      </div>

      {/* Persistent Mini Player at bottom */}
      <MiniPlayer />

      {/* Global Modals */}
      <FullPlayerModal
        onOpenNote={(rec) => setActiveNoteRecording(rec)}
        onOpenTag={(rec) => setActiveTagRecording(rec)}
      />

      <NoteModal
        recording={activeNoteRecording}
        isOpen={Boolean(activeNoteRecording)}
        onClose={() => setActiveNoteRecording(null)}
        onNoteSaved={() => refreshData()}
      />

      <TagModal
        recording={activeTagRecording}
        isOpen={Boolean(activeTagRecording)}
        onClose={() => setActiveTagRecording(null)}
        onTagsUpdated={() => refreshData()}
      />

      {/* New Tag standalone modal */}
      {isNewTagModalOpen && (
        <TagModal
          recording={{ id: 0, tags: [] }}
          isOpen={isNewTagModalOpen}
          onClose={() => setIsNewTagModalOpen(false)}
          onTagsUpdated={() => refreshData()}
        />
      )}

      <DeleteConfirmModal
        recording={activeDeleteRecording}
        isOpen={Boolean(activeDeleteRecording)}
        onClose={() => setActiveDeleteRecording(null)}
        onDeleted={() => refreshData()}
      />
    </div>
  );
}
