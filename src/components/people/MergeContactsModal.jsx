import React, { useState, useEffect } from 'react';
import {
  X,
  GitMerge,
  Users,
  Check,
  Phone,
  Clock,
  ArrowRight,
  AlertCircle,
  Search,
} from 'lucide-react';
import { api } from '../../lib/ipc';
import { useApp } from '../../context/AppContext';
import {
  formatHoursMinutes,
  getInitials,
  getAvatarColor,
} from '../../lib/formatters';

export function MergeContactsModal({
  isOpen,
  onClose,
  initialSourceContact = null,
  onMerged,
}) {
  const { fetchStats, refreshData } = useApp();
  const [people, setPeople] = useState([]);
  const [sourceContact, setSourceContact] = useState(null);
  const [targetContact, setTargetContact] = useState(null);
  const [finalName, setFinalName] = useState('');
  const [finalPhone, setFinalPhone] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState(null);

  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');

  useEffect(() => {
    async function loadContacts() {
      try {
        const list = await api.recordings.getPeople();
        setPeople(list || []);
      } catch (err) {
        console.error('Failed to load contacts for merge:', err);
      }
    }
    if (isOpen) {
      loadContacts();
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialSourceContact) {
      setSourceContact(initialSourceContact);
    }
  }, [initialSourceContact]);

  useEffect(() => {
    if (sourceContact || targetContact) {
      // Pick best default name & phone
      const candidateName =
        sourceContact?.person_name ||
        targetContact?.person_name ||
        sourceContact?.identifier ||
        targetContact?.identifier ||
        '';
      const candidatePhone =
        targetContact?.phone_number ||
        sourceContact?.phone_number ||
        '';

      if (!finalName && candidateName) setFinalName(candidateName);
      if (!finalPhone && candidatePhone) setFinalPhone(candidatePhone);
    }
  }, [sourceContact, targetContact]);

  if (!isOpen) return null;

  const handleExecuteMerge = async () => {
    if (!sourceContact || !targetContact) {
      setError('Please select two contacts to merge.');
      return;
    }
    if (sourceContact.identifier === targetContact.identifier) {
      setError('Cannot merge a contact with itself. Please select two different contacts.');
      return;
    }
    if (!finalName.trim() && !finalPhone.trim()) {
      setError('Please provide a final name or phone number for the merged contact.');
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      await api.recordings.mergeContacts(sourceContact, targetContact, {
        personName: finalName.trim(),
        phoneNumber: finalPhone.trim(),
      });
      await fetchStats();
      refreshData();
      if (onMerged) onMerged();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to merge contacts');
    } finally {
      setIsMerging(false);
    }
  };

  const filteredSourcePeople = people.filter((p) => {
    const term = sourceSearch.toLowerCase();
    return (
      (p.person_name && p.person_name.toLowerCase().includes(term)) ||
      (p.phone_number && p.phone_number.toLowerCase().includes(term)) ||
      (p.identifier && p.identifier.toLowerCase().includes(term))
    );
  });

  const filteredTargetPeople = people.filter((p) => {
    if (sourceContact && p.identifier === sourceContact.identifier) return false;
    const term = targetSearch.toLowerCase();
    return (
      (p.person_name && p.person_name.toLowerCase().includes(term)) ||
      (p.phone_number && p.phone_number.toLowerCase().includes(term)) ||
      (p.identifier && p.identifier.toLowerCase().includes(term))
    );
  });

  const totalMergedCalls =
    (sourceContact ? sourceContact.total_recordings : 0) +
    (targetContact ? targetContact.total_recordings : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-vault-900 border border-vault-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vault-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Merge Contacts</h3>
              <p className="text-xs text-slate-400">
                Unify two contact records and their call histories into one
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-vault-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Contact Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact 1 */}
            <div className="p-4 rounded-2xl bg-vault-950/70 border border-vault-800 flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Contact A
              </label>

              {sourceContact ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-vault-900 border border-vault-750">
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(
                        sourceContact.identifier
                      )} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {getInitials(sourceContact.identifier)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {sourceContact.person_name || sourceContact.identifier}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {sourceContact.phone_number || `${sourceContact.total_recordings} calls`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSourceContact(null)}
                    className="text-xs text-sky-400 hover:underline ml-2"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      placeholder="Search contact A..."
                      className="w-full bg-vault-900 border border-vault-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {filteredSourcePeople.slice(0, 15).map((p) => (
                      <button
                        key={p.identifier}
                        type="button"
                        onClick={() => {
                          setSourceContact(p);
                          if (!finalName) setFinalName(p.person_name || p.identifier);
                          if (!finalPhone && p.phone_number) setFinalPhone(p.phone_number);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-vault-850 flex items-center justify-between text-xs transition"
                      >
                        <span className="text-slate-200 truncate font-medium">
                          {p.person_name || p.identifier}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {p.total_recordings} calls
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact 2 */}
            <div className="p-4 rounded-2xl bg-vault-950/70 border border-vault-800 flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Contact B
              </label>

              {targetContact ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-vault-900 border border-vault-750">
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(
                        targetContact.identifier
                      )} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {getInitials(targetContact.identifier)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {targetContact.person_name || targetContact.identifier}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {targetContact.phone_number || `${targetContact.total_recordings} calls`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTargetContact(null)}
                    className="text-xs text-sky-400 hover:underline ml-2"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      placeholder="Search contact B to merge..."
                      className="w-full bg-vault-900 border border-vault-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {filteredTargetPeople.slice(0, 15).map((p) => (
                      <button
                        key={p.identifier}
                        type="button"
                        onClick={() => {
                          setTargetContact(p);
                          if (!finalName && p.person_name) setFinalName(p.person_name);
                          if (!finalPhone && p.phone_number) setFinalPhone(p.phone_number);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-vault-850 flex items-center justify-between text-xs transition"
                      >
                        <span className="text-slate-200 truncate font-medium">
                          {p.person_name || p.identifier}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {p.total_recordings} calls
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unified Contact Output Form */}
          <div className="p-4 rounded-2xl bg-vault-950/90 border border-vault-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Merged Identity Preview
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Final Display Name
              </label>
              <input
                type="text"
                value={finalName}
                onChange={(e) => setFinalName(e.target.value)}
                placeholder="Unified contact name (e.g. Rahul)"
                className="w-full bg-vault-900 border border-vault-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Final Phone Number (Optional)
              </label>
              <input
                type="text"
                value={finalPhone}
                onChange={(e) => setFinalPhone(e.target.value)}
                placeholder="Phone number (e.g. +91 98765 43210)"
                className="w-full bg-vault-900 border border-vault-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {sourceContact && targetContact && (
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs text-sky-300 flex items-center justify-between">
                <span>
                  All <strong>{totalMergedCalls}</strong> calls will be grouped under{' '}
                  <strong>{finalName || 'this contact'}</strong>.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-vault-800 bg-vault-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteMerge}
            disabled={isMerging || !sourceContact || !targetContact}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/25 transition disabled:opacity-50"
          >
            <GitMerge className="w-4 h-4" />
            <span>{isMerging ? 'Merging Contacts...' : 'Merge Contacts'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
