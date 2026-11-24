import React, { useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { MiniPlayer } from '../player/MiniPlayer';
import { FullPlayerModal } from '../player/FullPlayerModal';
import { TagModal } from '../recordings/TagModal';
import { NoteModal } from '../recordings/NoteModal';
import { DeleteConfirmModal } from '../recordings/DeleteConfirmModal';
import { MergeContactsModal } from '../people/MergeContactsModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { usePlayer } from '../../context/PlayerContext';
import { useApp } from '../../context/AppContext';

export function AppShell({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const {
    refreshData,
    activeNoteRecording,
    closeNoteModal,
    activeTagRecording,
    closeTagModal,
    activeDeleteRecording,
    closeDeleteModal,
    activeMergeContact,
    isMergeModalOpen,
    closeMergeModal,
  } = useApp();

  const { pathname } = useLocation();
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    // If user searches while not in Library, navigate back to library
    if (query && pathname !== '/') {
      navigate('/');
    }
  }, [navigate, pathname, setSearchQuery]);

  return (
    <div className="app-shell">
      <PlayerShortcuts />
      <TitleBar searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />

        <main className="workspace">
          <Outlet />
        </main>
      </div>

      {/* Persistent Mini Player at bottom */}
      <MiniPlayer />

      {/* Full Player Modal */}
      <FullPlayerModal />

      {/* Note Modal */}
      <ActiveNoteModal
        recording={activeNoteRecording}
        isOpen={Boolean(activeNoteRecording)}
        onClose={closeNoteModal}
        onNoteSaved={refreshData}
      />

      {activeTagRecording && <ActiveTagModal recording={activeTagRecording} onClose={closeTagModal} onUpdated={refreshData} />}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        key={activeDeleteRecording?.id ?? 'closed'}
        recording={activeDeleteRecording}
        isOpen={Boolean(activeDeleteRecording)}
        onClose={closeDeleteModal}
        onDeleted={refreshData}
      />

      {/* Merge Contacts Modal */}
      <MergeContactsModal
        isOpen={isMergeModalOpen}
        onClose={closeMergeModal}
        initialSourceContact={activeMergeContact}
        onMerged={refreshData}
      />
    </div>
  );
}


function PlayerShortcuts() {
  useKeyboardShortcuts();
  return null;
}

function ActiveNoteModal({ onNoteSaved, ...props }) {
  const { patchCurrentRecording } = usePlayer();
  return <NoteModal {...props} onNoteSaved={(recording) => {
    if (recording) patchCurrentRecording(recording);
    onNoteSaved();
  }} />;
}

function ActiveTagModal({ onUpdated, ...props }) {
  const { patchCurrentRecording } = usePlayer();
  return <TagModal {...props} onTagsUpdated={(recording) => {
    patchCurrentRecording(recording);
    onUpdated();
  }} />;
}
