import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mic2, Clock3, HardDrive, FolderClosed } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useRecordings } from '../../hooks/useRecordings';
import { RecordingList } from '../../components/recordings/RecordingList';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatHoursMinutes, formatFileSize, localDateKey } from '../../lib/formatters';
import { SORT_OPTIONS } from '../../lib/constants';
import { SortSelector } from '../../components/common/SortSelector';

const filters = [
  ['all', 'All calls'],
  ['notes', 'With notes'],
  ['today', 'Today'],
  ['week', 'Last 7 days'],
  ['favorites', 'Favorites'],
  ['missing', 'Unavailable'],
];

export function LibraryView({ searchQuery }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { stats, settings } = useApp();
  const filter = searchParams.get('filter') || 'all';
  const [sort, setSort] = useState(SORT_OPTIONS[0]);

  const options = useMemo(() => {
    const params = { sortBy: sort.column, sortOrder: sort.order, search: searchQuery };
    if (filter === 'notes') params.hasNotes = true;
    if (filter === 'favorites') params.favorite = true;
    if (filter === 'missing') params.available = 0;
    if (filter === 'today') params.date = localDateKey();
    if (filter === 'week') {
      const firstDay = new Date();
      firstDay.setDate(firstDay.getDate() - 6);
      params.dateFrom = localDateKey(firstDay);
      params.dateTo = localDateKey();
    }
    return params;
  }, [filter, sort, searchQuery]);

  const { recordings, loading, updating, error } = useRecordings(options);

  return (
    <div className="workspace-view">
      <header className="workspace-header library-header">
        <div className="archive-cover">
          <div className="cover-title">
            <span className="cover-folder"><FolderClosed />{settings.recording_folder?.split(/[\\/]/).filter(Boolean).pop() || 'Local library'}</span>
            <h1>Recordings</h1>
            <div className="cover-stats">
              <span><Mic2 />{Number(stats.total_recordings || 0).toLocaleString()} calls</span>
              <span><Clock3 />{formatHoursMinutes(stats.total_duration_seconds)}</span>
              <span><HardDrive />{formatFileSize(stats.total_file_size)}</span>
            </div>
          </div>
          <div className="tape-art" aria-hidden="true">
            <div className="tape-label"><i /><i /><i /></div>
            <div className="tape-window"><i /><b /><i /></div>
            <div className="tape-foot" />
          </div>
        </div>
        <div className="library-filters" aria-label="Recording filters">
          {filters.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setSearchParams(id === 'all' ? {} : { filter: id })}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="library-results">
        <div className="history-caption" role="status">
        <span>{searchQuery ? `Results for “${searchQuery}”` : 'Call history'}</span>
        <small>{updating ? 'Updating…' : error ? 'Could not load recordings' : `${recordings.length.toLocaleString()} shown`}</small>
        </div>
        <SortSelector sortOption={sort} onSortChange={setSort} />
      </div>

      <RecordingList
        recordings={recordings}
        groupByDate={sort.column === 'recorded_at'}
        searchHighlight={searchQuery}
        listKey={`${filter}:${sort.value}:${searchQuery}`}
        busy={updating}
      >
        {loading ? <LoadingSpinner text="Loading recordings…" /> : recordings.length === 0 && (
          <EmptyState
            icon={Mic2}
            title={error ? 'Could not load recordings' : searchQuery ? 'No matching recordings' : 'No recordings found'}
            description={searchQuery ? 'Try a contact name, phone number, note, tag, or date.' : 'Recordings that match this filter will appear here.'}
          />
        )}
      </RecordingList>
    </div>
  );
}
