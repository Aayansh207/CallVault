import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Star,
  Phone,
  Calendar,
  Clock,
  HardDrive,
  FileText,
  Tag as TagIcon,
  Folder,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useApp } from '../../context/AppContext';
import { PLAYBACK_SPEEDS } from '../../lib/constants';
import {
  formatDuration,
  formatFileSize,
  formatDate,
  formatTime,
  getInitials,
  getAvatarColor,
  maskPhoneNumber,
} from '../../lib/formatters';
import { Badge } from '../common/Badge';
import { api } from '../../lib/ipc';

export function FullPlayerModal() {
  const { openNoteModal } = useApp();
  const {
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    isFullPlayerOpen,
    closeFullPlayer,
    togglePlayPause,
    seek,
    skip,
    setSpeed,
    changeVolume,
    toggleMute,
    playNext,
    playPrevious,
    toggleFavorite,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'notes' | 'details'

  if (!isFullPlayerOpen || !currentRecording) return null;

  const displayName = currentRecording.person_name || currentRecording.phone_number || 'Unknown';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    seek(parseFloat(e.target.value));
  };

  const handleRevealInFinder = async () => {
    await api.system.revealInFinder(currentRecording.file_path);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-vault-900 border border-vault-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vault-800">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest font-bold text-sky-400">
              CALLVAULT PLAYER
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleFavorite}
              className="p-2 rounded-xl hover:bg-vault-800 text-slate-400 hover:text-amber-400 transition"
              title="Favorite"
            >
              <Star
                className={`w-5 h-5 ${
                  currentRecording.favorite ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>
            <button
              type="button"
              onClick={closeFullPlayer}
              className="p-2 rounded-xl hover:bg-vault-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center text-center">
          {/* Big Avatar */}
          <div
            className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${getAvatarColor(
              displayName
            )} flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-sky-950/40 mb-5 relative`}
          >
            {isPlaying ? (
              <div className="flex items-end space-x-1 h-10">
                <span className="w-2 bg-white rounded-full animate-wave-1" />
                <span className="w-2 bg-white rounded-full animate-wave-2" />
                <span className="w-2 bg-white rounded-full animate-wave-3" />
                <span className="w-2 bg-white rounded-full animate-wave-4" />
              </div>
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </div>

          {/* Contact Details */}
          <h2 className="text-2xl font-bold text-slate-100 mb-1">{displayName}</h2>

          {currentRecording.phone_number && (
            <p className="flex items-center space-x-1.5 text-sm text-slate-400 font-mono mb-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentRecording.phone_number}</span>
            </p>
          )}

          <div className="flex items-center space-x-3 text-xs text-slate-400 mb-6">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDate(currentRecording.recorded_at)}</span>
            </span>
            <span>·</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTime(currentRecording.recorded_at, true)}</span>
            </span>
          </div>


          {/* Waveform / Scrubber */}
          <div className="w-full max-w-lg mb-6">
            <div className="relative mb-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-vault-800 rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="tabular-nums">{formatDuration(currentTime)}</span>
              <span className="tabular-nums">{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Primary Controls */}
          <div className="flex items-center space-x-6 mb-8">
            <button
              type="button"
              onClick={playPrevious}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-100 hover:bg-vault-800 transition"
              title="Previous recording"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => skip(-15)}
              className="p-3 rounded-2xl text-slate-300 hover:text-white hover:bg-vault-800 transition flex flex-col items-center"
              title="Skip -15s"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-mono">15s</span>
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 flex items-center justify-center font-bold shadow-xl shadow-sky-500/25 hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skip(30)}
              className="p-3 rounded-2xl text-slate-300 hover:text-white hover:bg-vault-800 transition flex flex-col items-center"
              title="Skip +30s"
            >
              <RotateCw className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-mono">30s</span>
            </button>

            <button
              type="button"
              onClick={playNext}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-100 hover:bg-vault-800 transition"
              title="Next recording"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center space-x-2 mb-6 bg-vault-950/80 p-1.5 rounded-2xl border border-vault-800">
            {PLAYBACK_SPEEDS.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSpeed(spd)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  playbackRate === spd
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-vault-800'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3 w-64 mb-6">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 text-slate-400 hover:text-slate-200 transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-vault-800 rounded-lg"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              type="button"
              onClick={() => openNoteModal(currentRecording)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-vault-800/90 hover:bg-vault-750 text-slate-200 border border-vault-700/60 transition shadow-sm"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>{currentRecording.note_content ? 'Edit Note' : 'Add Note'}</span>
            </button>

            <button
              type="button"
              onClick={handleRevealInFinder}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-vault-800/90 hover:bg-vault-750 text-slate-200 border border-vault-700/60 transition shadow-sm"
            >
              <Folder className="w-4 h-4 text-amber-400" />
              <span>Show in Finder</span>
            </button>
          </div>

          {/* Note preview if any */}
          {currentRecording.note_content && (
            <div className="w-full max-w-md mt-6 p-4 rounded-2xl bg-vault-950/60 border border-vault-800 text-left">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-sky-400 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Recording Note</span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {currentRecording.note_content}
              </p>
            </div>
          )}

          {/* File details card */}
          <div className="w-full max-w-md mt-6 p-3 rounded-2xl bg-vault-950/40 border border-vault-850 text-left text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>File size:</span>
              <span className="font-mono text-slate-300">
                {formatFileSize(currentRecording.file_size)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Filename:</span>
              <span className="font-mono text-slate-300 truncate max-w-[240px]">
                {currentRecording.file_name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
