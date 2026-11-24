import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Star,
  Phone,
  FileText,
  Gauge,
} from 'lucide-react';
import { usePlayer, usePlayerTime } from '../../context/PlayerContext';
import { useApp } from '../../context/AppContext';
import { formatDuration, getInitials, getAvatarColor } from '../../lib/formatters';

export function MiniPlayer() {
  const {
    currentRecording,
    isPlaying,
    isLoading,
    duration,
    playbackRate,
    setSpeed,
    togglePlayPause,
    seek,
    skip,
    volume,
    changeVolume,
    isMuted,
    toggleMute,
    toggleFavorite,
    openFullPlayer,
  } = usePlayer();
  const currentTime = usePlayerTime();
  const { openNoteModal, settings } = useApp();

  if (!currentRecording) return null;
  const backSeconds = Number(settings.skip_backward_seconds) || 15;
  const forwardSeconds = Number(settings.skip_forward_seconds) || 30;

  const displayName = currentRecording.person_name || currentRecording.phone_number || 'Unknown';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  const handleCycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeed(nextSpeed);
  };

  return (
    <div className="mini-player h-20 min-h-[5rem] flex-shrink-0 bg-vault-950/95 border-t border-vault-800/90 px-3 sm:px-5 flex items-center justify-between z-40 select-none shadow-2xl relative">
      <input className="transport-seek" type="range" aria-label="Seek recording" title="Drag to seek"
        min={0} max={duration || 1} step={0.1} value={currentTime} disabled={!duration}
        onChange={handleSeekChange} style={{ '--progress': `${progressPercent}%` }} />

      {/* Left: Contact & Track Information */}
      <div className="flex items-center space-x-4 max-w-xs md:max-w-sm flex-1 min-w-0">
        <div
          onClick={openFullPlayer}
          className="cursor-pointer relative flex-shrink-0 group"
          title="Open Full Player"
        >
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(
              displayName
            )} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}
          >
            {isPlaying ? (
              <div className="flex items-end space-x-0.5 h-4">
                <span className="w-1 bg-white rounded-full animate-wave-1" />
                <span className="w-1 bg-white rounded-full animate-wave-2" />
                <span className="w-1 bg-white rounded-full animate-wave-3" />
                <span className="w-1 bg-white rounded-full animate-wave-4" />
              </div>
            ) : (
              getInitials(displayName)
            )}
          </div>
        </div>

        <div className="min-w-0 pr-2 flex-1">
          <div className="flex items-center space-x-2">
            <h4
              onClick={openFullPlayer}
              className="text-sm font-semibold text-slate-100 truncate cursor-pointer hover:text-sky-400 transition-colors"
            >
              {displayName}
            </h4>
            <button
              type="button"
              onClick={() => toggleFavorite().catch(console.error)}
              className="text-slate-500 hover:text-amber-400 transition flex-shrink-0"
              title="Favorite Call"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  currentRecording.favorite ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400 truncate">
            {currentRecording.phone_number ? (
              <span className="flex items-center space-x-1 font-mono text-[11px] truncate">
                <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="truncate">{currentRecording.phone_number}</span>
              </span>
            ) : (
              <span>Call Recording</span>
            )}

            {/* Quick Note Button */}
            <button
              type="button"
              onClick={() => openNoteModal(currentRecording)}
              className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-lg transition ${
                currentRecording.note_content
                  ? 'text-sky-300 hover:text-sky-200 bg-sky-950/80 border border-sky-800/60'
                  : 'text-slate-400 hover:text-slate-200 bg-vault-900 hover:bg-vault-850 border border-vault-800'
              }`}
              title={currentRecording.note_content || 'Add Note'}
            >
              <FileText className="w-3 h-3 text-sky-400" />
              <span>{currentRecording.note_content ? 'Note' : '+Note'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center flex-1 max-w-xl min-w-0 px-2">
        {/* Buttons Cluster */}
        <div className="flex items-center space-x-2 sm:space-x-4 mb-1.5">
          {/* Skip backward 15s */}
          <button
            type="button"
            onClick={() => skip(-backSeconds)}
            className="mini-skip p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-vault-900 transition flex items-center space-x-1"
            title="Skip backward 15 seconds (Shift+Left)"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold text-slate-500">{backSeconds}</span>
          </button>

          {/* Primary Illuminated Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-sky-500/25 hover:scale-105 active:scale-95 transition"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip forward 30s */}
          <button
            type="button"
            onClick={() => skip(forwardSeconds)}
            className="mini-skip p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-vault-900 transition flex items-center space-x-1"
            title="Skip forward 30 seconds (Shift+Right)"
          >
            <span className="text-[10px] font-mono font-bold text-slate-500">{forwardSeconds}</span>
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Quick Speed Switcher Pill */}
          <button
            type="button"
            onClick={handleCycleSpeed}
            className="px-2 py-0.5 rounded-lg bg-vault-900 hover:bg-vault-850 border border-vault-800 text-[11px] font-bold font-mono text-slate-300 transition"
            title="Click to cycle playback speed"
          >
            {playbackRate}×
          </button>
        </div>

        {/* Scrubber row with high-precision time */}
        <div className="flex items-center justify-center gap-1 text-xs font-mono text-slate-400">
          <span className="tabular-nums text-right font-medium text-slate-300">
            {formatDuration(currentTime)}
          </span>
          <span aria-hidden="true">/</span>
          <span className="tabular-nums font-medium text-slate-400">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Full Player Expander */}
      <div className="flex items-center space-x-4 flex-1 justify-end max-w-xs">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition"
            title="Mute / Unmute (M)"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <input
            type="range"
            min={0}
            aria-label="Volume"
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            className="mini-extra w-20 h-1.5 bg-vault-850 rounded-lg hidden sm:block"
            title="Volume (Up/Down)"
          />
        </div>

        <button
          type="button"
          onClick={openFullPlayer}
          className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-vault-900 transition"
          title="Open Full Player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
