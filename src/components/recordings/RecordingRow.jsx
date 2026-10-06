import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Star,
  MoreVertical,
  Phone,
  FileText,
  AlertTriangle,
  Folder,
  ExternalLink,
  Trash2,
  Search,
  MessageSquarePlus,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/ipc';
import {
  formatDuration,
  formatTime,
  formatDate,
  getInitials,
  getAvatarColor,
} from '../../lib/formatters';

export function RecordingRow({
  recording,
  playlist = [],
  searchHighlight = '',
  onOpenNote,
  onOpenDelete,
  onUpdated,
}) {
  const { currentRecording, isPlaying, playRecording, togglePlayPause, toggleFavorite } = usePlayer();
  const { openNoteModal, openDeleteModal } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCurrent = currentRecording?.id === recording.id;
  const isRowPlaying = isCurrent && isPlaying;
  const isAvailable = recording.available === 1;

  // Close context menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlayPause();
    } else {
      playRecording(recording, playlist);
    }
  };

  const handleFavClick = async (e) => {
    e.stopPropagation();
    await toggleFavorite(recording);
    if (onUpdated) onUpdated();
  };

  const handleNoteClick = (e) => {
    e.stopPropagation();
    if (onOpenNote) onOpenNote(recording);
    else openNoteModal(recording);
  };

  const handleRevealInFinder = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    await api.system.revealInFinder(recording.file_path);
  };

  const handleOpenWith = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    await api.system.openWith(recording.file_path);
  };

  const handleLocateFile = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    const updated = await api.recordings.locateFile(recording.id);
    if (updated && onUpdated) onUpdated();
  };

  const displayName = recording.person_name || recording.phone_number || 'Unknown';
  const hasPhone = recording.person_name && recording.phone_number;

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isCurrent
          ? 'bg-gradient-to-r from-sky-950/50 via-vault-900/90 to-vault-900/70 border-sky-500/40 shadow-xl shadow-sky-950/30 ring-1 ring-sky-500/20'
          : 'bg-vault-900/60 hover:bg-vault-850/80 border-vault-800/70 hover:border-slate-700/80 hover:shadow-lg'
      } ${!isAvailable ? 'opacity-65' : ''}`}
    >
      {/* Left: Avatar & Identity Details */}
      <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-3">
        {/* Play / Avatar circle */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(
              displayName
            )} flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform group-hover:scale-105`}
          >
            {isRowPlaying ? (
              <div className="flex items-end space-x-0.5 h-4">
                <span className="w-1 bg-white rounded-full animate-wave-1" />
                <span className="w-1 bg-white rounded-full animate-wave-2" />
                <span className="w-1 bg-white rounded-full animate-wave-3" />
                <span className="w-1 bg-white rounded-full animate-wave-4" />
              </div>
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={isRowPlaying ? 'Pause' : 'Play'}
            className={`absolute inset-0 rounded-2xl flex items-center justify-center transition-all bg-black/60 text-white backdrop-blur-[2px] ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isRowPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Text information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 flex-wrap">
            <span
              className={`font-semibold text-sm truncate tracking-tight ${
                isCurrent ? 'text-sky-300' : 'text-slate-100'
              }`}
            >
              {displayName}
            </span>

            {!isAvailable && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                <AlertTriangle className="w-3 h-3" />
                <span>Unavailable</span>
              </span>
            )}

            {/* Note Snippet Pill */}
            {recording.note_content ? (
              <button
                type="button"
                onClick={handleNoteClick}
                className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg text-xs bg-sky-950/60 border border-sky-800/60 text-sky-300 hover:bg-sky-900/60 transition max-w-xs truncate"
                title={recording.note_content}
              >
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[160px] text-[11px] font-medium">
                  {recording.note_content}
                </span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center space-x-2.5 mt-1 text-xs text-slate-400">
            {hasPhone && (
              <span className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>{recording.phone_number}</span>
              </span>
            )}
            {hasPhone && <span>·</span>}
            <span className="font-mono text-slate-400 text-[11px]">
              {formatTime(recording.recorded_at)}
            </span>
            <span>·</span>
            <span className="text-slate-400 text-[11px]">
              {formatDate(recording.recorded_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Duration & Quick Actions */}
      <div className="flex items-center space-x-3.5 flex-shrink-0 mt-3 sm:mt-0 justify-end">
        {/* Quick Add Note button on hover if no note exists */}
        {!recording.note_content && (
          <button
            type="button"
            onClick={handleNoteClick}
            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-vault-800/80 transition opacity-0 group-hover:opacity-100"
            title="Add Note"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        )}

        {/* Duration Badge */}
        <div className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-vault-950/70 border border-vault-800/80 text-slate-300 tabular-nums">
          {formatDuration(recording.duration_seconds)}
        </div>

        {/* Favorite Star */}
        <button
          type="button"
          onClick={handleFavClick}
          aria-label="Toggle Favorite"
          className={`p-1.5 rounded-lg transition ${
            recording.favorite
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-slate-500 hover:text-slate-300 hover:bg-vault-800'
          }`}
        >
          <Star
            className={`w-4 h-4 ${recording.favorite ? 'fill-amber-400' : ''}`}
          />
        </button>

        {/* Context Menu ⋮ */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-vault-800 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-2 w-48 bg-vault-900 border border-vault-700/90 rounded-2xl shadow-2xl py-1 z-30 animate-modal text-xs text-slate-200"
            >
              <button
                type="button"
                onClick={handlePlayClick}
                className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-vault-800 text-left"
              >
                {isRowPlaying ? (
                  <Pause className="w-4 h-4 text-sky-400" />
                ) : (
                  <Play className="w-4 h-4 text-sky-400" />
                )}
                <span>{isRowPlaying ? 'Pause' : 'Play Recording'}</span>
              </button>

              <button
                type="button"
                onClick={handleFavClick}
                className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-vault-800 text-left"
              >
                <Star className="w-4 h-4 text-amber-400" />
                <span>{recording.favorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (onOpenNote) onOpenNote(recording);
                  else openNoteModal(recording);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-vault-800 text-left"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>{recording.note_content ? 'Edit Note' : 'Add Note'}</span>
              </button>

              <div className="my-1 border-t border-vault-800" />

              <button
                type="button"
                onClick={handleRevealInFinder}
                className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-vault-800 text-left"
              >
                <Folder className="w-4 h-4 text-slate-400" />
                <span>Reveal in Finder</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWith}
                className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-vault-800 text-left"
              >
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span>Open with Default App</span>
              </button>

              {!isAvailable && (
                <button
                  type="button"
                  onClick={handleLocateFile}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-vault-800 text-amber-300 text-left"
                >
                  <Search className="w-4 h-4" />
                  <span>Locate File...</span>
                </button>
              )}

              <div className="my-1 border-t border-vault-800" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (onOpenDelete) onOpenDelete(recording);
                  else openDeleteModal(recording);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-rose-950/40 text-rose-400 text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete...</span>
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
