import React, { useState, useEffect, useMemo } from 'react';
import {
  Mic2,
  Calendar,
  Filter,
  ArrowUpDown,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/ipc';
import { useApp } from '../../context/AppContext';
import { RecordingRow } from '../../components/recordings/RecordingRow';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getDateHeaderGroup } from '../../lib/formatters';
import { SORT_OPTIONS } from '../../lib/constants';

export function LibraryView({ searchQuery, onOpenNote, onOpenTag, onOpenDelete }) {
  const { refreshTrigger, selectedTag } = useApp();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'favorites' | 'missing'
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const params = {
        sortBy: sortOption.column,
        sortOrder: sortOption.order,
        search: searchQuery || undefined,
        tagId: selectedTag || undefined,
      };

      if (dateFilter === 'favorites') {
        params.favorite = true;
      } else if (dateFilter === 'missing') {
        params.available = 0;
      } else if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        params.date = todayStr;
      } else if (dateFilter === 'week') {
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
  }, [searchQuery, dateFilter, sortOption, selectedTag, refreshTrigger]);

  // Group recordings by Date Header
  const groupedRecordings = useMemo(() => {
    const groups = [];
    let currentHeader = null;
    let currentItems = [];

    for (const rec of recordings) {
      const header = getDateHeaderGroup(rec.recorded_at);
      if (header !== currentHeader) {
        if (currentItems.length > 0) {
          groups.push({ header: currentHeader, items: currentItems });
        }
        currentHeader = header;
        currentItems = [rec];
      } else {
        currentItems.push(rec);
      }
    }

    if (currentItems.length > 0) {
      groups.push({ header: currentHeader, items: currentItems });
    }

    return groups;
  }, [recordings]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-vault-950">
      {/* Header bar */}
      <div className="px-8 pt-7 pb-4 border-b border-vault-850/80 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
              <span>All Recordings</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {recordings.length.toLocaleString()}{' '}
              {recordings.length === 1 ? 'recording' : 'recordings'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <select
              value={sortOption.value}
              onChange={(e) => {
                const opt = SORT_OPTIONS.find((s) => s.value === e.target.value);
                if (opt) setSortOption(opt);
              }}
              className="bg-vault-900 border border-vault-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'missing', label: 'Unavailable' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setDateFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                dateFilter === pill.id
                  ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-vault-900 hover:bg-vault-850 text-slate-400 hover:text-slate-200 border border-vault-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Recordings List */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {loading ? (
          <LoadingSpinner text="Loading recordings..." />
        ) : recordings.length === 0 ? (
          <EmptyState
            icon={Mic2}
            title="No recordings found"
            description={
              searchQuery
                ? `No call recordings match "${searchQuery}". Try a different name or number.`
                : 'No recordings match the selected filter. Try choosing "All".'
            }
          />
        ) : (
          groupedRecordings.map((group) => (
            <section key={group.header} className="space-y-2">
              <div className="sticky top-0 z-10 py-1 bg-vault-950/95 backdrop-blur-md">
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  {group.header}
                </h3>
              </div>
              <div className="space-y-1.5">
                {group.items.map((recording) => (
                  <RecordingRow
                    key={recording.id}
                    recording={recording}
                    playlist={recordings}
                    onOpenNote={onOpenNote}
                    onOpenTag={onOpenTag}
                    onOpenDelete={onOpenDelete}
                    onUpdated={loadRecordings}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
