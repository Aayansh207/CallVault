import React, { useState, useEffect } from 'react';
import { X, FileText, Check } from 'lucide-react';
import { api } from '../../lib/ipc';

export function NoteModal({ recording, isOpen, onClose, onNoteSaved }) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (recording) {
      setContent(recording.note_content || '');
    }
  }, [recording]);

  if (!isOpen || !recording) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await api.recordings.saveNote(recording.id, content.trim());
      if (onNoteSaved) onNoteSaved(updated);
      onClose();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-vault-900 border border-vault-700/60 rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-modal">
        <div className="flex items-center justify-between pb-4 border-b border-vault-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100">
              Note for {recording.person_name || recording.phone_number || 'Recording'}
            </h3>
          </div>
          <button
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
            placeholder="Write meeting notes, action items, or remarks..."
            className="w-full bg-vault-950 border border-vault-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
            autoFocus
          />
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
