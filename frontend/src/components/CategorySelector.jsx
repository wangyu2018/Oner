import React from 'react';
import { Tag } from 'lucide-react';

export default function CategorySelector({ categories, value = '', onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="appearance-none pl-8 pr-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300
        focus:ring-2 focus:ring-accent-500 focus:border-transparent cursor-pointer max-w-[150px]"
    >
      <option value="">无分类</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.name}>{cat.name}</option>
      ))}
    </select>
  );
}

export function CategoryBadge({ category, categories = [], size = 'sm' }) {
  if (!category) return null;

  const cat = categories.find(c => c.name === category);
  const color = cat?.color || '#6b7280';
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1 py-0.5' : 'text-xs px-1.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses} rounded font-medium`}
      style={{ backgroundColor: color + '20', color }}
    >
      <Tag size={size === 'xs' ? 9 : 11} />
      {category}
    </span>
  );
}
