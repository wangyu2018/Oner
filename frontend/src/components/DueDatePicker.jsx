import React from 'react';
import { Calendar, X } from 'lucide-react';

export default function DueDatePicker({ value, onChange }) {
  // 格式化日期为 YYYY-MM-DD
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  // 检查是否已过期
  const isOverdue = () => {
    if (!value) return false;
    const dueDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // 检查是否今天到期
  const isDueToday = () => {
    if (!value) return false;
    const dueDate = new Date(value);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  };

  // 格式化显示日期
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '设置截止日期';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === tomorrow.toDateString()) return '明天';

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="date"
          value={formatDate(value)}
          onChange={(e) => onChange(e.target.value || null)}
          className="appearance-none pl-8 pr-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {value && (
        <button
          onClick={() => onChange(null)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
          title="清除日期"
        >
          <X size={14} />
        </button>
      )}

      {value && (
        <span className={`text-xs ${
          isOverdue()
            ? 'text-red-500'
            : isDueToday()
              ? 'text-orange-500'
              : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatDisplayDate(value)}
        </span>
      )}
    </div>
  );
}
