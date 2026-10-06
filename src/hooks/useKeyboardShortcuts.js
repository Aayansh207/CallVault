import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export function useKeyboardShortcuts() {
  const {
    isPlaying,
    togglePlayPause,
    skip,
    volume,
    changeVolume,
    toggleMute,
    toggleFavorite,
    currentRecording,
  } = usePlayer();

  useEffect(() => {
    function handleKeyDown(e) {
      // Do not intercept if user is typing in an input, textarea, or contentEditable element
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        document.activeElement?.isContentEditable;

      if (isInput) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            skip(-15);
          } else {
            skip(-5);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            skip(30);
          } else {
            skip(5);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;

        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;

        case 'KeyF':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            toggleFavorite();
          }
          break;

        case 'KeyM':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            toggleMute();
          }
          break;

        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    togglePlayPause,
    skip,
    volume,
    changeVolume,
    toggleMute,
    toggleFavorite,
    currentRecording,
  ]);
}
