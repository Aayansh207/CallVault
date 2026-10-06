import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { MiniPlayer } from '../player/MiniPlayer';
import { FullPlayerModal } from '../player/FullPlayerModal';
import { NoteModal } from '../recordings/NoteModal';
import { DeleteConfirmModal } from '../recordings/DeleteConfirmModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useApp } from '../../context/AppContext';

export function AppShell({ searchQuery, setSearchQuery, onOpenNote, onOpenDelete }) {
  const navigate = useNavigate();
  const { refreshData } = useApp();

  // Active modals
  const [activeNoteRecording, setActiveNoteRecording] = useState(null);
  const [activeDeleteRecording, setActiveDeleteRecording] = useState(null);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // If user searches while not in Library, navigate back to library
    if (query && window.location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleOpenNoteModal = (rec) => {
    setActiveNoteRecording(rec);
    if (onOpenNote) onOpenNote(rec);
  };

  const handleOpenDeleteModal = (rec) => {
    setActiveDeleteRecording(rec);
    if (onOpenDelete) onOpenDelete(rec);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-vault-950 text-slate-100 select-none">
      {/* Title Bar */}
      <TitleBar searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-vault-950">
          <Outlet />
        </main>
      </div>

      {/* Persistent Mini Player at bottom with quick note support */}
      <MiniPlayer onOpenNote={handleOpenNoteModal} />

      {/* Full Player Modal */}
      <FullPlayerModal
        onOpenNote={handleOpenNoteModal}
      />

      {/* Note Modal */}
      <NoteModal
        recording={activeNoteRecording}
        isOpen={Boolean(activeNoteRecording)}
        onClose={() => setActiveNoteRecording(null)}
        onNoteSaved={() => refreshData()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        recording={activeDeleteRecording}
        isOpen={Boolean(activeDeleteRecording)}
        onClose={() => setActiveDeleteRecording(null)}
        onDeleted={() => refreshData()}
      />
    </div>
  );
}
