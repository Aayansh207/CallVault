import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './AppContext';
import { api } from '../lib/ipc';

const PlayerContext = createContext(null);
const RowPlayerContext = createContext(null);
const PlayerTimeContext = createContext(0);

export function PlayerProvider({ children }) {
  const { settings, refreshData } = useApp();
  const [currentRecording, setCurrentRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new Audio();
  const currentRef = useRef(null);
  const nextRef = useRef(() => {});
  const savePositionIntervalRef = useRef(null);

  // Sync volume & rate to audio element
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  // Periodic position persistence to database
  const persistPosition = useCallback((recId, time) => {
    if (recId && Number.isFinite(time) && time >= 0) {
      api.recordings.updatePosition(recId, time).catch(() => {});
    }
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      const currentRecording = currentRef.current;
      setDuration(audio.duration || currentRecording?.duration_seconds || 0);
      setIsLoading(false);

      // Resume from previous playback position if any
      if (currentRecording?.playback_position && currentRecording.playback_position > 0) {
        if (currentRecording.playback_position < (audio.duration || 100000)) {
          audio.currentTime = currentRecording.playback_position;
          setCurrentTime(currentRecording.playback_position);
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    const handleEnded = () => {
      const currentRecording = currentRef.current;
      setIsPlaying(false);
      if (currentRecording) {
        // Reset position on end
        persistPosition(currentRecording.id, 0);
      }
      nextRef.current();
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [persistPosition]);

  // Auto-save position every 5s while playing
  useEffect(() => {
    if (isPlaying && currentRecording) {
      savePositionIntervalRef.current = setInterval(() => {
        persistPosition(currentRecording.id, audioRef.current.currentTime);
      }, 5000);
    } else {
      if (savePositionIntervalRef.current) {
        clearInterval(savePositionIntervalRef.current);
        savePositionIntervalRef.current = null;
      }
    }
    return () => {
      if (savePositionIntervalRef.current) {
        clearInterval(savePositionIntervalRef.current);
      }
    };
  }, [isPlaying, currentRecording, persistPosition]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio.src) return;
    if (audio.paused) {
      audio.play().catch((error) => {
        if (error.name !== 'AbortError') console.warn(error);
      });
    } else {
      audio.pause();
      persistPosition(currentRef.current?.id, audio.currentTime);
    }
  }, [persistPosition]);

  const playRecording = useCallback((recording, currentList = null) => {
    if (!recording?.available) return;
    if (currentList?.length) setPlaylist(currentList);
    const previous = currentRef.current;
    if (previous?.id === recording.id) {
      togglePlayPause();
      return;
    }

    const audio = audioRef.current;
    if (previous && !audio.ended) persistPosition(previous.id, audio.currentTime);
    audio.pause();
    currentRef.current = recording;
    setCurrentRecording(recording);
    setCurrentTime(recording.playback_position || 0);
    setDuration(recording.duration_seconds || 0);
    setIsLoading(true);
    audio.src = api.toAudioUrl(recording.file_path);

    audio.play().catch((error) => {
      if (error.name === 'AbortError' || currentRef.current?.id !== recording.id) return;
      console.warn('Playback failed:', error);
      setIsPlaying(false);
      setIsLoading(false);
    });
  }, [persistPosition, togglePlayPause]);

  const seek = useCallback((seconds) => {
    const audio = audioRef.current;
    if (!audio.src || !Number.isFinite(seconds)) return;
    const clamped = Math.max(0, Math.min(seconds, audio.duration || duration));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
    if (currentRecording) {
      persistPosition(currentRecording.id, clamped);
    }
  }, [duration, currentRecording, persistPosition]);

  const skip = useCallback((deltaSeconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = audio.currentTime + deltaSeconds;
    seek(target);
  }, [seek]);

  const setSpeed = useCallback((speed) => {
    setPlaybackRate(speed);
    audioRef.current.playbackRate = speed;
  }, []);

  const changeVolume = useCallback((val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    setIsMuted(false);
    audioRef.current.volume = clamped;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      audioRef.current.volume = next ? 0 : volume;
      return next;
    });
  }, [volume]);

  const moveInPlaylist = useCallback((direction) => {
    const index = playlist.findIndex((recording) => recording.id === currentRef.current?.id);
    if (index < 0) return;
    for (let next = index + direction; next >= 0 && next < playlist.length; next += direction) {
      if (playlist[next].available) {
        playRecording(playlist[next]);
        break;
      }
    }
  }, [playlist, playRecording]);

  const playNext = useCallback(() => moveInPlaylist(1), [moveInPlaylist]);
  const playPrevious = useCallback(() => moveInPlaylist(-1), [moveInPlaylist]);

  useEffect(() => {
    nextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
    const speed = Number(settings.default_playback_speed);
    if (speed > 0) setSpeed(speed);
  }, [settings.default_playback_speed, setSpeed]);

  const patchCurrentRecording = useCallback((updated) => {
    if (currentRef.current?.id !== updated.id) return;
    currentRef.current = { ...currentRef.current, ...updated };
    setCurrentRecording(currentRef.current);
  }, []);

  const toggleFavorite = useCallback(async (recording = null) => {
    const target = recording?.id ? recording : currentRef.current;
    if (!target) return;
    const newFav = target.favorite ? 0 : 1;
    const updated = await api.recordings.favorite(target.id, newFav);
    patchCurrentRecording({ id: target.id, favorite: newFav });
    setPlaylist((previous) => {
      const index = previous.findIndex((item) => item.id === target.id);
      if (index < 0) return previous;
      const next = previous.slice();
      next[index] = { ...next[index], favorite: newFav };
      return next;
    });
    refreshData();
    return updated;
  }, [refreshData, patchCurrentRecording]);

  const rowControls = useMemo(() => ({
    currentId: currentRecording?.id, isPlaying, playRecording, togglePlayPause, toggleFavorite,
  }), [currentRecording?.id, isPlaying, playRecording, togglePlayPause, toggleFavorite]);

  const value = useMemo(() => ({
    currentRecording,
    isPlaying,
    isLoading,
    duration,
    playbackRate,
    volume,
    isMuted,
    isFullPlayerOpen,
    playlist,
    playRecording,
    togglePlayPause,
    seek,
    skip,
    setSpeed,
    changeVolume,
    toggleMute,
    playNext,
    playPrevious,
    toggleFavorite,
    openFullPlayer: () => setIsFullPlayerOpen(true),
    closeFullPlayer: () => setIsFullPlayerOpen(false),
    patchCurrentRecording,
  }), [
    currentRecording, isPlaying, isLoading, duration, playbackRate, volume, isMuted,
    isFullPlayerOpen, playlist, playRecording, togglePlayPause, seek, skip, setSpeed,
    changeVolume, toggleMute, playNext, playPrevious, toggleFavorite, patchCurrentRecording,
  ]);

  return (
    <PlayerContext.Provider value={value}>
      <RowPlayerContext.Provider value={rowControls}>
        <PlayerTimeContext.Provider value={currentTime}>{children}</PlayerTimeContext.Provider>
      </RowPlayerContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}

export function usePlayerTime() {
  return useContext(PlayerTimeContext);
}

export function useRowPlayer() {
  return useContext(RowPlayerContext);
}
