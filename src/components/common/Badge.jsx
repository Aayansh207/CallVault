import React from 'react';

export function Badge({ children, color = '#6366f1', className = '', onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}40`,
        color: color,
      }}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      } ${className}`}
    >
      {children}
    </span>
  );
}
