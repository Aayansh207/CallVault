import React, { useState, useEffect } from 'react';
import { X, FileText, Check } from 'lucide-react';
import { api } from '../../lib/ipc';

export function NoteModal({ recording, isOpen, onClose, onNoteSaved }) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (recording) {
      setContent(recording.note_content || '');
      setError('');
    }
  }, [recording]);

  if (!isOpen || !recording) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const updated = await api.recordings.saveNote(recording.id, content.trim());
      if (onNoteSaved) onNoteSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save the note.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-vault-900 border border-vault-700/60 rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-modal" role="dialog" aria-modal="true" aria-labelledby="note-title" onKeyDown={(event) => {
        if (event.key === 'Escape' && !isSaving) onClose();
      }}>
        <div className="flex items-center justify-between pb-4 border-b border-vault-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h3 id="note-title" className="font-semibold text-slate-100">
              Note for {recording.person_name || recording.phone_number || 'Recording'}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close note"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-vault-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            aria-label="Recording note"
            placeholder="Write a note…"
            className="w-full bg-vault-950 border border-vault-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
            autoFocus
          />
          {error && <p className="text-xs text-rose-400 mt-2" role="alert">{error}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-vault-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Note'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
