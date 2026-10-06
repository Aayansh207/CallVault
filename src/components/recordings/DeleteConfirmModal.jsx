import React, { useState } from 'react';
import { AlertTriangle, Trash2, FolderMinus, X } from 'lucide-react';
import { api } from '../../lib/ipc';

export function DeleteConfirmModal({ recording, isOpen, onClose, onDeleted }) {
  const [mode, setMode] = useState(null); // 'library' | 'file'
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !recording) return null;

  const handleDeleteLibraryOnly = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await api.recordings.deleteFromLibrary(recording.id);
      if (onDeleted) onDeleted(recording.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to remove from library');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePermanentFile = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await api.recordings.deleteFile(recording.id);
      if (onDeleted) onDeleted(recording.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete file from disk');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-vault-900 border border-vault-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-modal">
        <div className="flex items-center justify-between pb-3 border-b border-vault-800">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100">Delete Recording</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-vault-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-sm text-slate-300 font-medium mb-1">
            {recording.person_name || recording.phone_number || recording.file_name}
          </p>
          <p className="text-xs text-slate-500 font-mono break-all mb-4">
            {recording.file_path}
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          {!mode ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setMode('library')}
                className="w-full text-left p-3.5 rounded-xl border border-vault-700 bg-vault-850 hover:bg-vault-800 hover:border-slate-500 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-vault-750 text-slate-300 group-hover:text-white">
                    <FolderMinus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Remove from Library</h4>
                    <p className="text-xs text-slate-400">
                      Keeps audio file intact on your disk. Only deletes index metadata.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('file')}
                className="w-full text-left p-3.5 rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-700 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-rose-950/80 text-rose-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-rose-300">Delete Physical File</h4>
                    <p className="text-xs text-rose-400/80">
                      Permanently moves or deletes the .m4a file from your storage disk.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : mode === 'library' ? (
            <div className="p-4 rounded-xl bg-vault-850 border border-vault-750 space-y-3">
              <p className="text-sm text-slate-200">
                Are you sure you want to remove this recording from CallVault? The file on your disk will NOT be harmed.
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-vault-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLibraryOnly}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  {isDeleting ? 'Removing...' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-3">
              <p className="text-sm text-rose-200 font-medium">
                ⚠️ Warning: This will permanently delete the audio file from your hard drive! This cannot be undone.
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-vault-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDeletePermanentFile}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
