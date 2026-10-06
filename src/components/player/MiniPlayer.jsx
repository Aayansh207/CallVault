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
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { formatDuration, getInitials, getAvatarColor } from '../../lib/formatters';

export function MiniPlayer() {
  const {
    currentRecording,
    isPlaying,
    isLoading,
    currentTime,
    duration,
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

  if (!currentRecording) return null;

  const displayName = currentRecording.person_name || currentRecording.phone_number || 'Unknown';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  return (
    <div className="h-20 bg-vault-900/95 border-t border-vault-800/80 backdrop-blur-xl px-5 flex items-center justify-between z-40 select-none shadow-2xl relative">
      {/* Top progress line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-vault-800/50 cursor-pointer group">
        <div
          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-75 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Left: Track Information */}
      <div
        onClick={openFullPlayer}
        className="flex items-center space-x-3.5 cursor-pointer max-w-xs md:max-w-sm flex-1 group"
      >
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(
            displayName
          )} flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}
        >
          {isPlaying ? (
            <div className="flex items-end space-x-0.5 h-4">
              <span className="w-1 bg-white rounded-full animate-wave-1" />
              <span className="w-1 bg-white rounded-full animate-wave-2" />
              <span className="w-1 bg-white rounded-full animate-wave-3" />
            </div>
          ) : (
            getInitials(displayName)
          )}
        </div>

        <div className="min-w-0 pr-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
              {displayName}
            </h4>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              className="text-slate-500 hover:text-amber-400 transition"
            >
              <Star
                className={`w-3.5 h-3.5 ${currentRecording.favorite ? 'fill-amber-400 text-amber-400' : ''}`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-400 truncate flex items-center space-x-1 mt-0.5">
            {currentRecording.phone_number ? (
              <>
                <Phone className="w-3 h-3 text-slate-500 inline" />
                <span>{currentRecording.phone_number}</span>
              </>
            ) : (
              <span>Call Recording</span>
            )}
          </p>
        </div>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center flex-1 max-w-xl px-4">
        <div className="flex items-center space-x-4 mb-1">
          {/* Skip backward 15s */}
          <button
            type="button"
            onClick={() => skip(-15)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-vault-800 transition"
            title="Skip backward 15 seconds (Shift+Left)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Main Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip forward 30s */}
          <button
            type="button"
            onClick={() => skip(30)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-vault-800 transition"
            title="Skip forward 30 seconds (Shift+Right)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Scrubber row */}
        <div className="w-full flex items-center space-x-3 text-xs font-mono text-slate-400">
          <span className="tabular-nums w-10 text-right">{formatDuration(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="flex-1 h-1.5 bg-vault-800 rounded-lg"
          />
          <span className="tabular-nums w-10">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Right: Volume & Expand */}
      <div className="flex items-center space-x-3 flex-1 justify-end max-w-xs">
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
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-vault-800 rounded-lg hidden sm:block"
            title="Volume (Up/Down)"
          />
        </div>

        <button
          type="button"
          onClick={openFullPlayer}
          className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-vault-800 transition ml-2"
          title="Open Full Player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
