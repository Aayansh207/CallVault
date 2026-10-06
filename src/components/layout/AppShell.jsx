import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { MiniPlayer } from '../player/MiniPlayer';
import { FullPlayerModal } from '../player/FullPlayerModal';
import { NoteModal } from '../recordings/NoteModal';
import { DeleteConfirmModal } from '../recordings/DeleteConfirmModal';
import { MergeContactsModal } from '../people/MergeContactsModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useApp } from '../../context/AppContext';

export function AppShell({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const {
    refreshData,
    activeNoteRecording,
    closeNoteModal,
    openNoteModal,
    activeDeleteRecording,
    closeDeleteModal,
    activeMergeContact,
    isMergeModalOpen,
    closeMergeModal,
  } = useApp();

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
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-vault-950">
          <Outlet />
        </main>
      </div>

      {/* Persistent Mini Player at bottom */}
      <MiniPlayer />

      {/* Full Player Modal */}
      <FullPlayerModal />

      {/* Note Modal */}
      <NoteModal
        recording={activeNoteRecording}
        isOpen={Boolean(activeNoteRecording)}
        onClose={closeNoteModal}
        onNoteSaved={() => refreshData()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        recording={activeDeleteRecording}
        isOpen={Boolean(activeDeleteRecording)}
        onClose={closeDeleteModal}
        onDeleted={() => refreshData()}
      />

      {/* Merge Contacts Modal */}
      <MergeContactsModal
        isOpen={isMergeModalOpen}
        onClose={closeMergeModal}
        initialSourceContact={activeMergeContact}
        onMerged={() => refreshData()}
      />
    </div>
  );
}

