import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Mic2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/ipc';
import { RecordingList } from '../../components/recordings/RecordingList';
import { useRecordings } from '../../hooks/useRecordings';
import { localDateKey } from '../../lib/formatters';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SortSelector } from '../../components/common/SortSelector';
import { SORT_OPTIONS } from '../../lib/constants';

export function TimelineView() {
  const { refreshTrigger } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState(localDateKey);
  const [monthCounts, setMonthCounts] = useState({});
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Format YYYY-MM
  const yearMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Load monthly counts for calendar dots
  useEffect(() => {
    let active = true;
    async function loadCounts() {
      try {
        const counts = await api.recordings.getTimeline(yearMonthPrefix);
        const map = {};
        for (const item of counts) {
          map[item.date] = item.count;
        }
        if (active) setMonthCounts(map);
      } catch (err) {
        console.error('Failed to load timeline counts:', err);
      }
    }
    loadCounts();
    return () => { active = false; };
  }, [yearMonthPrefix, refreshTrigger]);

  const options = useMemo(() => ({
    date: selectedDayStr, available: 1, sortBy: sortOption.column, sortOrder: sortOption.order,
  }), [selectedDayStr, sortOption]);
  const { recordings: dayRecordings, loading, updating, error } = useRecordings(options);

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
    <div className="workspace-view timeline-view">
      {/* Left: Interactive Calendar */}
      <div className="timeline-calendar" tabIndex={0} role="region" aria-label="Recording calendar">
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
      <div className="workspace-view">
        <div className="workspace-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{selectedDateFormatted}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {dayRecordings.length}{' '}
              {dayRecordings.length === 1 ? 'call recording' : 'call recordings'}
            </p>
          </div>

          <SortSelector
            sortOption={sortOption}
            onSortChange={setSortOption}
          />
        </div>

        <RecordingList recordings={dayRecordings} listKey={selectedDayStr + sortOption.value} busy={updating}>
          {loading ? (
            <LoadingSpinner text="Loading day recordings..." />
          ) : dayRecordings.length === 0 ? (
            <EmptyState
              icon={Mic2}
              title={error ? 'Could not load this day' : 'No recordings on this date'}
              description={`There are no recorded calls for ${selectedDateFormatted}. Select a different date from the calendar.`}
            />
          ) : null}
        </RecordingList>
      </div>
    </div>
  );
}
