import React from 'react';
import { Flag } from 'lucide-react';

const PRIORITY_CONFIG = {
  low: { label: '低', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  normal: { label: '普通', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  high: { label: '高', color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  urgent: { label: '紧急', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
};

export default function PriorityBadge({ priority = 'normal', showLabel = true, size = 'sm' }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${config.bgColor} ${sizeClasses[size]}`}>
      <Flag size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} className={config.color} />
      {showLabel && (
        <span className={config.color}>{config.label}</span>
      )}
    </span>
  );
}

export function PrioritySelector({ value = 'normal', onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-7 pr-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
    >
      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
        <option key={key} value={key}>
          {config.label}
        </option>
      ))}
    </select>
  );
}

export { PRIORITY_CONFIG };
