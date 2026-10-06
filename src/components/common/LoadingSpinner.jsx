import React from 'react';

export function LoadingSpinner({ size = 'md', text = null }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-vault-700 border-t-sky-400 animate-spin`}
      />
      {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
    </div>
  );
}
