import React, { useState } from 'react';
import { X, Tag as TagIcon, Plus, Check } from 'lucide-react';
import { api } from '../../lib/ipc';
import { useApp } from '../../context/AppContext';

export function TagModal({ recording, onClose, onTagsUpdated }) {
  const { tags, fetchTags } = useApp();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#38bdf8');
  const [busy, setBusy] = useState(false);
  const [assigned, setAssigned] = useState(() => recording.tags || []);
  const [error, setError] = useState('');

  const currentTagIds = new Set(assigned.map((t) => t.id));

  const save = async (mutate) => {
    setBusy(true);
    setError('');
    try {
      const next = await mutate();
      setAssigned(next);
      onTagsUpdated({ id: recording.id, tags: next });
    } catch (err) {
      setError(err.message || 'Could not update tags.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleTag = (tag) => save(() => currentTagIds.has(tag.id)
    ? api.recordings.removeTag(recording.id, tag.id)
    : api.recordings.addTag(recording.id, tag.id));

  const handleCreateTag = (event) => {
    event.preventDefault();
    if (busy || !newTagName.trim()) return;
    save(async () => {
      const tag = await api.recordings.createTag(newTagName.trim(), newTagColor);
      await fetchTags();
      const next = await api.recordings.addTag(recording.id, tag.id);
      setNewTagName('');
      return next;
    });
  };

  const colorPalette = ['#38bdf8', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#ec4899'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-vault-900 border border-vault-700/60 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-modal max-h-[calc(100vh-2rem)] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="tag-title" onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) onClose();
      }}>
        <div className="flex items-center justify-between pb-4 border-b border-vault-800">
          <div className="flex items-center space-x-2">
            <TagIcon className="w-5 h-5 text-indigo-400" />
            <h3 id="tag-title" className="font-semibold text-slate-100">Manage Tags</h3>
          </div>
          <button
            type="button"
            aria-label="Close tags"
            disabled={busy}
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-vault-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Tags List */}
        <div className="my-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Select tags for this call
          </p>
          <div className="library-filters">
            {tags.map((tag) => {
              const isSelected = currentTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  aria-pressed={isSelected}
                  disabled={busy}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create new tag */}
        <form onSubmit={handleCreateTag} className="pt-4 border-t border-vault-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Create New Tag
          </p>
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              aria-label="Tag name"
              maxLength={64}
              autoFocus
              className="flex-1 bg-vault-950 border border-vault-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={busy || !newTagName.trim()}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Color:</span>
            {colorPalette.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Tag color ${c}`}
                aria-pressed={newTagColor === c}
                onClick={() => setNewTagColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  newTagColor === c ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-vault-900 scale-110' : 'opacity-80'
                }`}
              />
            ))}
          </div>
        </form>

        {error && <p className="text-xs text-rose-400 mt-3" role="alert">{error}</p>}
        <div className="flex justify-end pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-vault-800 hover:bg-vault-700 text-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
