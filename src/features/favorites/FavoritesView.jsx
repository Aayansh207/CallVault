import React, { useState, useEffect } from 'react';
import { Star, Mic2 } from 'lucide-react';
import { api } from '../../lib/ipc';
import { useApp } from '../../context/AppContext';
import { RecordingRow } from '../../components/recordings/RecordingRow';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export function FavoritesView({ onOpenNote, onOpenDelete }) {
  const { refreshTrigger } = useApp();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const list = await api.recordings.list({
        favorite: true,
        sortBy: 'recorded_at',
        sortOrder: 'DESC',
      });
      setRecordings(list || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [refreshTrigger]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-vault-950">
      <div className="px-8 pt-7 pb-5 border-b border-vault-850/80 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          <span>Favorite Calls</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'} starred
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-2">
        {loading ? (
          <LoadingSpinner text="Loading favorites..." />
        ) : recordings.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No favorite recordings"
            description="Star important recordings from your library to quickly access them here anytime."
          />
        ) : (
          recordings.map((recording) => (
            <RecordingRow
              key={recording.id}
              recording={recording}
              playlist={recordings}
              onOpenNote={onOpenNote}
              onOpenDelete={onOpenDelete}
              onUpdated={loadFavorites}
            />
          ))
        )}
      </div>
    </div>
  );
}
