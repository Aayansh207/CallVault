import React, { useState, useEffect } from 'react';
import { Users, Phone, Clock, Mic2, Search, ArrowRight } from 'lucide-react';
import { api } from '../../lib/ipc';
import {
  formatHoursMinutes,
  getInitials,
  getAvatarColor,
  formatDate,
} from '../../lib/formatters';
import { PersonDetailView } from './PersonDetailView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export function PeopleView({ onOpenNote, onOpenTag, onOpenDelete }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    async function loadPeople() {
      try {
        setLoading(true);
        const data = await api.recordings.getPeople();
        setPeople(data || []);
      } catch (err) {
        console.error('Failed to load people:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPeople();
  }, []);

  if (selectedPerson) {
    return (
      <PersonDetailView
        person={selectedPerson}
        onBack={() => setSelectedPerson(null)}
        onOpenNote={onOpenNote}
        onOpenTag={onOpenTag}
        onOpenDelete={onOpenDelete}
      />
    );
  }

  const filteredPeople = people.filter((p) => {
    const term = search.toLowerCase();
    const nameMatch = p.person_name && p.person_name.toLowerCase().includes(term);
    const phoneMatch = p.phone_number && p.phone_number.toLowerCase().includes(term);
    return nameMatch || phoneMatch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-vault-950">
      {/* Header */}
      <div className="px-8 pt-7 pb-5 border-b border-vault-850/80 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
              <span>People & Contacts</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {people.length} {people.length === 1 ? 'contact' : 'contacts'} indexed with call histories
            </p>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter contacts..."
              className="w-full bg-vault-900 border border-vault-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Contacts */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <LoadingSpinner text="Loading contacts..." />
        ) : filteredPeople.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts found"
            description={
              search
                ? `No contact matches "${search}".`
                : 'No contacts found with recorded calls.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPeople.map((person) => {
              const displayName = person.person_name || person.phone_number || 'Unknown';
              return (
                <div
                  key={person.identifier}
                  onClick={() => setSelectedPerson(person)}
                  className="bg-vault-900/60 hover:bg-vault-850/80 border border-vault-800/80 hover:border-sky-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-150 hover:shadow-xl hover:shadow-sky-950/20 group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(
                        displayName
                      )} flex items-center justify-center text-white text-lg font-bold shadow-md group-hover:scale-105 transition-transform`}
                    >
                      {getInitials(displayName)}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-100 text-base truncate group-hover:text-sky-300 transition-colors">
                      {displayName}
                    </h3>
                    {person.person_name && person.phone_number && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{person.phone_number}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-vault-800/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Mic2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>{person.total_recordings} calls</span>
                    </div>
                    <div className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{formatHoursMinutes(person.total_duration_seconds)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
