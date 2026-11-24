import React, { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle, ExternalLink, FileText, Folder, MoreHorizontal, Pause, Play, Search, Star, Tag, Trash2,
} from 'lucide-react';
import { useRowPlayer } from '../../context/PlayerContext';
import { api } from '../../lib/ipc';
import { formatDuration, formatDate, formatTime, formatFileSize, getInitials, getAvatarColor } from '../../lib/formatters';

function Highlight({ text, query }) {
  if (!text || !query) return text;
  const tokens = query.replaceAll('"', '').split(/\s+/).filter(Boolean);
  if (!tokens.length) return text;
  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = String(text).split(new RegExp(`(${escaped.join('|')})`, 'iu'));
  return parts.map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part);
}

export const RecordingRow = memo(function RecordingRow({
  recording, playlist, searchHighlight, onOpenNote, onOpenTags, onOpenDelete, onUpdated,
}) {
  const { currentId, isPlaying, playRecording, togglePlayPause, toggleFavorite } = useRowPlayer();
  const [menu, setMenu] = useState(null);
  const [pendingFavorite, setPendingFavorite] = useState(null);
  const [error, setError] = useState('');
  const menuRef = useRef(null);
  const trigger = useRef(null);
  const isCurrent = currentId === recording.id;
  const playing = isCurrent && isPlaying;
  const available = Boolean(recording.available);
  const starred = pendingFavorite ?? Boolean(recording.favorite);
  const displayName = recording.person_name || recording.phone_number || recording.file_name;
  const phone = recording.person_name && recording.phone_number;

  useEffect(() => {
    setPendingFavorite(null);
  }, [recording.favorite]);

  useEffect(() => {
    const popup = menuRef.current;
    if (!menu || !popup) return;
    const roomBelow = window.innerHeight - menu.bottom;
    popup.style.top = `${roomBelow >= popup.offsetHeight + 8
      ? menu.bottom + 4
      : Math.max(8, menu.top - popup.offsetHeight - 4)}px`;
    popup.querySelector('button')?.focus({ preventScroll: true });

    function dismiss(event) {
      if (!popup.contains(event.target) && !trigger.current?.contains(event.target)) setMenu(null);
    }

    function escape(event) {
      if (event.key === 'Escape') {
        setMenu(null);
        trigger.current?.focus({ preventScroll: true });
      }
    }

    const close = () => setMenu(null);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    document.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const play = () => {
    if (!available) return;
    if (isCurrent) togglePlayPause();
    else playRecording(recording, playlist);
  };
  const favorite = async () => {
    if (pendingFavorite !== null) return;
    setError('');
    setPendingFavorite(!starred);
    try {
      await toggleFavorite(recording);
    } catch {
      setPendingFavorite(null);
      setError('Could not update favorite');
    }
  };

  const menuAction = (action) => async () => {
    setMenu(null);
    trigger.current?.focus({ preventScroll: true });
    try {
      await action();
    } catch {
      setError('Could not complete action');
    }
  };

  return (
    <article
      className="recording-row"
      data-current={isCurrent}
      data-available={available}
      onClick={(event) => {
        if (!event.target.closest('button')) play();
      }}
    >
      <button
        type="button"
        className={`recording-avatar bg-gradient-to-br ${getAvatarColor(displayName)}`}
        onClick={play}
        disabled={!available}
        aria-label={`${playing ? 'Pause' : 'Play'} ${displayName}`}
      >
        <span>{getInitials(displayName)}</span>
        {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
      </button>
      <div className="recording-info">
        <div className="recording-name" title={displayName}><Highlight text={displayName} query={searchHighlight} /></div>
        <div className="recording-meta">
          <span>{formatTime(recording.recorded_at)}</span>
          <span className="recording-full-date">{formatDate(recording.recorded_at)}</span>
          {recording.file_size > 0 && <span className="recording-file-size">{formatFileSize(recording.file_size)}</span>}
          {phone && <span><Highlight text={phone} query={searchHighlight} /></span>}
          {recording.tags?.length > 0 && <span className="recording-tags" title={recording.tags.map(tag => tag.name).join(', ')}>
            <Highlight text={recording.tags.map(tag => tag.name).join(', ')} query={searchHighlight} />
          </span>}
          {!available && <span className="text-amber-400"><AlertTriangle /> Unavailable</span>}
          {error && <span role="alert" className="text-rose-400">{error}</span>}
        </div>
      </div>
      {recording.note_content && (
        <button className="recording-note" type="button" onClick={() => onOpenNote(recording)} title={recording.note_content}>
          <FileText /><span><Highlight text={recording.note_content} query={searchHighlight} /></span>
        </button>
      )}
      <span className="recording-duration">{formatDuration(recording.duration_seconds)}</span>
      <div className="recording-actions">
        <button type="button" className="icon-button quick-note" onClick={() => onOpenNote(recording)} aria-label={`Note for ${displayName}`} title="Add or edit note">
          <FileText />
        </button>
        <button type="button" className="icon-button favorite-button" aria-pressed={starred} onClick={favorite} aria-label={`Favorite ${displayName}`} title={starred ? 'Remove favorite' : 'Add favorite'}>
          <Star fill={starred ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className="icon-button"
          ref={trigger}
          aria-label={`More actions for ${displayName}`}
          aria-expanded={Boolean(menu)}
          onClick={event => setMenu(menu ? null : event.currentTarget.getBoundingClientRect())}
        >
          <MoreHorizontal />
        </button>
      </div>
      {menu && createPortal(
        <div className="recording-menu animate-modal" ref={menuRef} style={{ right: Math.max(8, window.innerWidth - menu.right) }}>
          {available && <button type="button" onClick={menuAction(play)}>{playing ? <Pause /> : <Play />}{playing ? 'Pause' : 'Play recording'}</button>}
          <button type="button" onClick={menuAction(favorite)}><Star />{starred ? 'Remove favorite' : 'Add favorite'}</button>
          <button type="button" onClick={menuAction(() => onOpenNote(recording))}><FileText />{recording.note_content ? 'Edit note' : 'Add note'}</button>
          <button type="button" onClick={menuAction(() => onOpenTags(recording))}><Tag />Manage tags</button>
          {available ? <>
            <button type="button" onClick={menuAction(() => api.system.revealInFinder(recording.file_path))}><Folder />Reveal in file browser</button>
            <button type="button" onClick={menuAction(() => api.system.openWith(recording.file_path))}><ExternalLink />Open with default app</button>
          </> : (
            <button type="button" onClick={menuAction(async () => {
              if (await api.recordings.locateFile(recording.id)) onUpdated();
            })}><Search />Locate file</button>
          )}
          <button type="button" className="text-rose-400" onClick={menuAction(() => onOpenDelete(recording))}><Trash2 />Delete…</button>
        </div>, document.body,
      )}
    </article>
  );
});
