import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Clock,
  Mic2,
  Star,
  Calendar,
  GitMerge,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/ipc';
import {
  formatHoursMinutes,
  getInitials,
  getAvatarColor,
} from '../../lib/formatters';
import { RecordingRow } from '../../components/recordings/RecordingRow';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export function PersonDetailView({
  person,
  onBack,
  onOpenNote,
  onOpenDelete,
  onOpenMerge,
}) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFavOnly, setFilterFavOnly] = useState(false);
  const [filterNotesOnly, setFilterNotesOnly] = useState(false);

  const displayName = person.person_name || person.phone_number || 'Unknown';

  const loadPersonRecordings = async () => {
    try {
      setLoading(true);
      const params = {
        person: displayName,
        sortBy: 'recorded_at',
        sortOrder: 'DESC',
      };
      if (filterFavOnly) {
        params.favorite = true;
      }
      if (filterNotesOnly) {
        params.hasNotes = true;
      }
      const list = await api.recordings.list(params);
      setRecordings(list || []);
    } catch (err) {
      console.error('Failed to load person recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonRecordings();
  }, [person, filterFavOnly, filterNotesOnly]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-vault-950">
      {/* Top Banner / Contact Card */}
      <div className="px-8 pt-6 pb-6 border-b border-vault-850/80 bg-vault-900/40 flex-shrink-0 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-100 transition mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to All People</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarColor(
                displayName
              )} flex items-center justify-center text-white text-xl font-bold shadow-xl shadow-sky-950/30 flex-shrink-0`}
            >
              {getInitials(displayName)}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-100">{displayName}</h1>
              {person.phone_number && (
                <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{person.phone_number}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Contact Metrics */}
            <div className="flex items-center space-x-4 bg-vault-900/80 px-4 py-2.5 rounded-2xl border border-vault-800">
              <div className="text-center pr-3 border-r border-vault-800">
                <span className="block text-sm font-bold font-mono text-slate-100">
                  {person.total_recordings}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">Calls</span>
              </div>
              <div className="text-center">
                <span className="block text-sm font-bold font-mono text-sky-400">
                  {formatHoursMinutes(person.total_duration_seconds)}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">Total Time</span>
              </div>
            </div>

            {/* Merge button */}
            {onOpenMerge && (
              <button
                type="button"
                onClick={onOpenMerge}
                className="flex items-center space-x-1.5 px-3 py-2.5 rounded-2xl bg-vault-900 hover:bg-vault-850 border border-vault-800 text-xs font-semibold text-slate-300 hover:text-sky-300 transition"
                title="Merge this contact with another"
              >
                <GitMerge className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Merge</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="flex items-center space-x-2 mt-5">
          <button
            type="button"
            onClick={() => setFilterFavOnly(!filterFavOnly)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterFavOnly
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-vault-900 text-slate-400 hover:text-slate-200 border border-vault-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavOnly ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterNotesOnly(!filterNotesOnly)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterNotesOnly
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'bg-vault-900 text-slate-400 hover:text-slate-200 border border-vault-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>With Notes</span>
          </button>
        </div>
      </div>

      {/* Call History List */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-2">
        {loading ? (
          <LoadingSpinner text="Loading call history..." />
        ) : recordings.length === 0 ? (
          <EmptyState
            icon={Mic2}
            title="No calls found"
            description={
              filterFavOnly || filterNotesOnly
                ? `No calls match the active filters for ${displayName}.`
                : `No recordings found for this contact.`
            }
          />
        ) : (
          recordings.map((recording) => (
            <RecordingRow
              key={recording.id}
              recording={recording}
              playlist={recordings}
              onOpenNote={onOpenNote}
              onOpenDelete={onOpenDelete}
              onUpdated={loadPersonRecordings}
            />
          ))
        )}
      </div>
    </div>
  );
}
