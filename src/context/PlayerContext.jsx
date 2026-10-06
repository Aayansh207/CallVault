import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../lib/ipc';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
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

  const audioRef = useRef(new Audio());
  const savePositionIntervalRef = useRef(null);

  // Sync volume & rate to audio element
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  // Periodic position persistence to database
  const persistPosition = useCallback((recId, time) => {
    if (recId && time > 0) {
      api.recordings.updatePosition(recId, time).catch(() => {});
    }
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
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
      if (currentRecording) {
        persistPosition(currentRecording.id, audio.currentTime);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    const handleEnded = () => {
      setIsPlaying(false);
      if (currentRecording) {
        // Reset position on end
        persistPosition(currentRecording.id, 0);
      }
      playNext();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentRecording, persistPosition]);

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

  const playRecording = useCallback((recording, currentList = null) => {
    if (!recording) return;

    if (currentList && currentList.length > 0) {
      setPlaylist(currentList);
    }

    if (currentRecording?.id === recording.id) {
      // Toggle if already selected
      togglePlayPause();
      return;
    }

    const audio = audioRef.current;
    audio.pause();

    setCurrentRecording(recording);
    setCurrentTime(recording.playback_position || 0);
    setDuration(recording.duration_seconds || 0);
    setIsLoading(true);

    const audioUrl = api.toAudioUrl(recording.file_path);
    audio.src = audioUrl;
    audio.load();

    audio.play().catch((err) => {
      console.warn('Playback error or blocked by autoplay policy:', err);
      setIsPlaying(false);
      setIsLoading(false);
    });
  }, [currentRecording]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio.src) return;

    if (audio.paused) {
      audio.play().catch((e) => console.warn(e));
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
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

  const playNext = useCallback(() => {
    if (!playlist || playlist.length === 0 || !currentRecording) return;
    const currentIndex = playlist.findIndex((r) => r.id === currentRecording.id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      playRecording(playlist[currentIndex + 1], playlist);
    }
  }, [playlist, currentRecording, playRecording]);

  const playPrevious = useCallback(() => {
    if (!playlist || playlist.length === 0 || !currentRecording) return;
    const currentIndex = playlist.findIndex((r) => r.id === currentRecording.id);
    if (currentIndex > 0) {
      playRecording(playlist[currentIndex - 1], playlist);
    }
  }, [playlist, currentRecording, playRecording]);

  const toggleFavorite = useCallback(async (recording = null) => {
    const target = recording || currentRecording;
    if (!target) return;
    const newFav = target.favorite ? 0 : 1;
    const updated = await api.recordings.favorite(target.id, newFav);
    if (currentRecording?.id === target.id) {
      setCurrentRecording((prev) => ({ ...prev, favorite: newFav }));
    }
    return updated;
  }, [currentRecording]);

  const value = {
    currentRecording,
    isPlaying,
    isLoading,
    currentTime,
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
    setCurrentRecording,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
