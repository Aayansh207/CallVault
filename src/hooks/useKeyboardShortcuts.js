import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usePlayer } from '../context/PlayerContext';

export function useKeyboardShortcuts() {
  const { settings } = useApp();
  const { togglePlayPause, skip, volume, changeVolume, toggleMute, toggleFavorite, currentRecording } = usePlayer();

  useEffect(() => {
    function handleKeyDown(event) {
      if (!currentRecording || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement &&
          event.target.closest('input, textarea, select, button, a, [contenteditable], [role="region"]')) return;

      switch (event.code) {
        case 'Space':
          togglePlayPause();
          break;
        case 'ArrowLeft':
          skip(event.shiftKey ? -(Number(settings.skip_backward_seconds) || 15) : -5);
          break;
        case 'ArrowRight':
          skip(event.shiftKey ? Number(settings.skip_forward_seconds) || 30 : 5);
          break;
        case 'ArrowUp':
          changeVolume(volume + 0.1);
          break;
        case 'ArrowDown':
          changeVolume(volume - 0.1);
          break;
        case 'KeyF':
          if (!event.repeat) toggleFavorite().catch(console.error);
          break;
        case 'KeyM':
          if (!event.repeat) toggleMute();
          break;
        default:
          return;
      }
      event.preventDefault();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRecording, settings, togglePlayPause, skip, volume, changeVolume, toggleMute, toggleFavorite]);
}
