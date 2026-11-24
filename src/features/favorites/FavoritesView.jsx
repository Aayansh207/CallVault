import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { RecordingList } from '../../components/recordings/RecordingList';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { SortSelector } from '../../components/common/SortSelector';
import { useRecordings } from '../../hooks/useRecordings';
import { SORT_OPTIONS } from '../../lib/constants';

export function FavoritesView() {
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const options = useMemo(() => ({ favorite: true, sortBy: sort.column, sortOrder: sort.order }), [sort]);
  const { recordings, loading, updating, error } = useRecordings(options);

  return (
    <div className="workspace-view">
      <header className="workspace-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1>Favorites</h1>
          <p className="text-sm text-slate-400">{recordings.length.toLocaleString()} starred recordings</p>
        </div>
        <SortSelector sortOption={sort} onSortChange={setSort} />
      </header>
      <RecordingList recordings={recordings} listKey={sort.value} busy={updating}>
        {loading ? <LoadingSpinner text="Loading favorites…" /> : recordings.length === 0 && (
          <EmptyState icon={Star} title={error ? 'Could not load favorites' : 'No favorites yet'} description="Star a recording to keep it here." />
        )}
      </RecordingList>
    </div>
  );
}
