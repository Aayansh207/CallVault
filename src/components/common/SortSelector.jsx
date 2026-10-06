import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS } from '../../lib/constants';

export function SortSelector({
  sortOption,
  onSortChange,
  options = SORT_OPTIONS,
  className = '',
  label = 'Sort:',
}) {
  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      <div className="flex items-center space-x-1.5 text-slate-400 select-none">
        <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline font-medium">{label}</span>
      </div>
      <select
        value={sortOption.value}
        onChange={(e) => {
          const opt = options.find((s) => s.value === e.target.value);
          if (opt) onSortChange(opt);
        }}
        className="bg-vault-900 hover:bg-vault-850 border border-vault-800 hover:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer shadow-sm transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
