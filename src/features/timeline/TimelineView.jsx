import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Mic2,
} from 'lucide-react';
import { api } from '../../lib/ipc';
import { RecordingRow } from '../../components/recordings/RecordingRow';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function TimelineView({ onOpenNote, onOpenTag, onOpenDelete }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [monthCounts, setMonthCounts] = useState({});
  const [dayRecordings, setDayRecordings] = useState([]);
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Format YYYY-MM
  const yearMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Load monthly counts for calendar dots
  useEffect(() => {
    async function loadCounts() {
      try {
        const counts = await api.recordings.getTimeline(yearMonthPrefix);
        const map = {};
        for (const item of counts) {
          map[item.date] = item.count;
        }
        setMonthCounts(map);
      } catch (err) {
        console.error('Failed to load timeline counts:', err);
      }
    }
    loadCounts();
  }, [yearMonthPrefix]);

  // Load recordings for selected day
  useEffect(() => {
    async function loadDayRecordings() {
      if (!selectedDayStr) return;
      try {
        setLoading(true);
        const list = await api.recordings.list({
          date: selectedDayStr,
          sortBy: 'recorded_at',
          sortOrder: 'DESC',
        });
        setDayRecordings(list || []);
      } catch (err) {
        console.error('Failed to load day recordings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDayRecordings();
  }, [selectedDayStr]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays = [];
  // Empty slots before month start
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Days in month
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      dateStr: dStr,
      count: monthCounts[dStr] || 0,
    });
  }

  const selectedDateFormatted = selectedDayStr
    ? new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-vault-950">
      {/* Left: Interactive Calendar */}
      <div className="w-full md:w-96 p-6 border-b md:border-b-0 md:border-r border-vault-850/80 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-sky-400" />
            <span>{monthName}</span>
          </h2>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-vault-850 text-slate-400 hover:text-slate-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-vault-850 text-slate-400 hover:text-slate-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((item, idx) => {
            if (!item) {
              return <div key={`empty-${idx}`} className="h-11 rounded-xl" />;
            }

            const isSelected = item.dateStr === selectedDayStr;
            const hasCalls = item.count > 0;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => setSelectedDayStr(item.dateStr)}
                className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all text-xs ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20 scale-105'
                    : hasCalls
                    ? 'bg-vault-900 hover:bg-vault-850 text-slate-100 border border-vault-800'
                    : 'text-slate-400 hover:bg-vault-900/40'
                }`}
              >
                <span>{item.dayNumber}</span>
                {hasCalls && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-slate-950' : 'bg-sky-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick jump to Today */}
        <div className="mt-6 pt-4 border-t border-vault-850">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDayStr(now.toISOString().split('T')[0]);
            }}
            className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-vault-900 transition border border-vault-800/60"
          >
            Jump to Today
          </button>
        </div>
      </div>

      {/* Right: Calls on selected day */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-vault-850/80 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-100">{selectedDateFormatted}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {dayRecordings.length}{' '}
            {dayRecordings.length === 1 ? 'call recording' : 'call recordings'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {loading ? (
            <LoadingSpinner text="Loading day recordings..." />
          ) : dayRecordings.length === 0 ? (
            <EmptyState
              icon={Mic2}
              title="No recordings on this date"
              description={`There are no recorded calls for ${selectedDateFormatted}. Select a different date from the calendar.`}
            />
          ) : (
            dayRecordings.map((recording) => (
              <RecordingRow
                key={recording.id}
                recording={recording}
                playlist={dayRecordings}
                onOpenNote={onOpenNote}
                onOpenTag={onOpenTag}
                onOpenDelete={onOpenDelete}
                onUpdated={() => {
                  api.recordings
                    .list({
                      date: selectedDayStr,
                      sortBy: 'recorded_at',
                      sortOrder: 'DESC',
                    })
                    .then((res) => setDayRecordings(res || []));
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
