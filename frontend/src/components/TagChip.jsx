import React from 'react';
import { Hash } from 'lucide-react';

export default function TagChip({ tag, onClick, size = 'sm' }) {
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full font-medium
        bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-300
        ${onClick ? 'cursor-pointer hover:bg-accent-200 dark:hover:bg-accent-900' : ''}
        ${sizeClasses[size]}`}
    >
      <Hash size={size === 'xs' ? 10 : 12} />
      {tag}
    </span>
  );
}
