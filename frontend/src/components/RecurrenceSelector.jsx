import React from 'react';
import { Repeat } from 'lucide-react';

const RECURRENCE_OPTIONS = [
  { value: '', label: '不重复', description: '单次任务' },
  { value: 'daily', label: '每天', description: '每天重复' },
  { value: 'weekday', label: '每个工作日', description: '周一至周五重复' },
  { value: 'weekly', label: '每周', description: '每周同一天重复' },
  { value: 'biweekly', label: '每两周', description: '每隔一周重复' },
  { value: 'monthly', label: '每月', description: '每月同一天重复' },
  { value: 'yearly', label: '每年', description: '每年同一天重复' },
];

export const RECURRENCE_LABELS = Object.fromEntries(
  RECURRENCE_OPTIONS.map(({ value, label }) => [value, label])
);

export default function RecurrenceSelector({ value = '', onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-8 pr-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300
        focus:ring-2 focus:ring-accent-500 focus:border-transparent cursor-pointer"
    >
      {RECURRENCE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// 用于 NoteCard 的小徽章
export function RecurrenceBadge({ recurrence, size = 'sm' }) {
  if (!recurrence) return null;

  const label = RECURRENCE_LABELS[recurrence];
  if (!label) return null;

  const sizeClasses = size === 'xs'
    ? 'text-[10px] px-1 py-0.5'
    : 'text-xs px-1.5 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses}
      rounded bg-purple-100 dark:bg-purple-900/30
      text-purple-700 dark:text-purple-300`}
    >
      <Repeat size={size === 'xs' ? 9 : 11} />
      {label}
    </span>
  );
}
