import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mic2,
  Calendar,
  Filter,
  ArrowUpDown,
  Search,
  FileText,
  Star,
  Clock,
  HardDrive,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '../../lib/ipc';
import { useApp } from '../../context/AppContext';
import { RecordingRow } from '../../components/recordings/RecordingRow';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getDateHeaderGroup, formatHoursMinutes, formatFileSize } from '../../lib/formatters';
import { SORT_OPTIONS } from '../../lib/constants';
import { SortSelector } from '../../components/common/SortSelector';

export function LibraryView({ searchQuery, setSearchQuery }) {
  const [searchParams] = useSearchParams();
  const { refreshTrigger, stats, openNoteModal, openDeleteModal } = useApp();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const initialFilter = searchParams.get('filter') === 'notes' ? 'notes' : 'all';
  const [filterMode, setFilterMode] = useState(initialFilter); // 'all' | 'notes' | 'today' | 'week' | 'favorites' | 'missing'
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  useEffect(() => {
    if (searchParams.get('filter') === 'notes') {
      setFilterMode('notes');
    }
  }, [searchParams]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const params = {
        sortBy: sortOption.column,
        sortOrder: sortOption.order,
        search: searchQuery || undefined,
      };

      if (filterMode === 'notes') {
        params.hasNotes = true;
      } else if (filterMode === 'favorites') {
        params.favorite = true;
      } else if (filterMode === 'missing') {
        params.available = 0;
      } else if (filterMode === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        params.date = todayStr;
      } else if (filterMode === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.dateFrom = weekAgo.toISOString().split('T')[0];
      }

      const list = await api.recordings.list(params);
      setRecordings(list || []);
    } catch (err) {
      console.error('Failed to load recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, [searchQuery, filterMode, sortOption, refreshTrigger]);

  // Group recordings by Date Header with aggregated daily duration & counts
  const groupedRecordings = useMemo(() => {
    const groups = [];
    let currentHeader = null;
    let currentItems = [];
    let currentTotalSeconds = 0;

    for (const rec of recordings) {
      const header = getDateHeaderGroup(rec.recorded_at);
      if (header !== currentHeader) {
        if (currentItems.length > 0) {
          groups.push({
            header: currentHeader,
            items: currentItems,
            totalSeconds: currentTotalSeconds,
          });
        }
        currentHeader = header;
        currentItems = [rec];
        currentTotalSeconds = rec.duration_seconds || 0;
      } else {
        currentItems.push(rec);
        currentTotalSeconds += rec.duration_seconds || 0;
      }
    }

    if (currentItems.length > 0) {
      groups.push({
        header: currentHeader,
        items: currentItems,
        totalSeconds: currentTotalSeconds,
      });
    }

    return groups;
  }, [recordings]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-vault-950">
      {/* Header Bar */}
      <div className="px-8 pt-7 pb-4 border-b border-vault-850/80 flex-shrink-0 bg-vault-950/80 backdrop-blur-md">
        {/* Title & Quick Stats Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-2.5">
                <span>All Recordings</span>
              </h1>
              {filterMode === 'notes' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800">
                  Notes Filter Active
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
              <span>
                <strong>{recordings.length.toLocaleString()}</strong> calls displayed
              </span>
              <span>·</span>
              <span>
                <strong>{formatHoursMinutes(stats.total_duration_seconds)}</strong> total talk time
              </span>
              <span>·</span>
              <span>
                <strong>{formatFileSize(stats.total_file_size)}</strong> stored locally
              </span>
            </p>
          </div>

          {/* Sort selector */}
          <SortSelector sortOption={sortOption} onSortChange={setSortOption} />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Calls' },
            { id: 'notes', label: 'With Notes 📝', count: stats.total_with_notes },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'favorites', label: 'Favorites ★', count: stats.total_favorites },
            { id: 'missing', label: 'Unavailable ⚠️' },
          ].map((pill) => {
            const isActive = filterMode === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterMode(pill.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-sky-500/20'
                    : 'bg-vault-900 hover:bg-vault-850 text-slate-400 hover:text-slate-200 border border-vault-800'
                }`}
              >
                <span>{pill.label}</span>
                {pill.count !== undefined && pill.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-slate-950 text-sky-300' : 'bg-vault-800 text-slate-400'
                    }`}
                  >
                    {pill.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Recordings Stream */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {loading ? (
          <LoadingSpinner text="Searching and loading recordings..." />
        ) : recordings.length === 0 ? (
          <EmptyState
            icon={Mic2}
            title={searchQuery ? 'No recordings match your search' : 'No recordings found'}
            description={
              searchQuery
                ? `No calls match "${searchQuery}". Try searching by person name, phone number, note keywords, or month names (e.g. "October", "Oct 6").`
                : filterMode === 'notes'
                ? 'No recordings currently have notes. Add a note to any call by clicking the note icon.'
                : 'No calls match the selected filter.'
            }
          />
        ) : sortOption.column === 'recorded_at' ? (
          groupedRecordings.map((group) => (
            <section key={group.header} className="space-y-2.5">
              {/* Sticky Date Header with Daily Count & Duration */}
              <div className="sticky top-0 z-10 py-1.5 px-1 bg-vault-950/95 backdrop-blur-md flex items-center justify-between border-b border-vault-850/60">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                    {group.header}
                  </h3>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-3">
                  <span>
                    {group.items.length} {group.items.length === 1 ? 'call' : 'calls'}
                  </span>
                  <span>·</span>
                  <span>{formatHoursMinutes(group.totalSeconds)}</span>
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {group.items.map((recording) => (
                  <RecordingRow
                    key={recording.id}
                    recording={recording}
                    playlist={recordings}
                    searchHighlight={searchQuery}
                    onOpenNote={openNoteModal}
                    onOpenDelete={openDeleteModal}
                    onUpdated={loadRecordings}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="space-y-2">
            {recordings.map((recording) => (
              <RecordingRow
                key={recording.id}
                recording={recording}
                playlist={recordings}
                searchHighlight={searchQuery}
                onOpenNote={openNoteModal}
                onOpenDelete={openDeleteModal}
                onUpdated={loadRecordings}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
