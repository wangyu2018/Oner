import React from 'react';
import { FileText, Circle, Loader, CheckCircle, Archive } from 'lucide-react';

const STATUS_CONFIG = {
  note: { icon: FileText, color: 'gray', label: '备忘', bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-700 dark:text-gray-300' },
  todo: { icon: Circle, color: 'blue', label: '待办', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300' },
  in_progress: { icon: Loader, color: 'yellow', label: '进行中', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-300' },
  done: { icon: CheckCircle, color: 'green', label: '已完成', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-300' },
  archived: { icon: Archive, color: 'gray', label: '已归档', bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-500 dark:text-gray-400' },
};

export default function StatusSelector({ value = 'note', onChange }) {
  const currentStatus = STATUS_CONFIG[value] || STATUS_CONFIG.note;
  const Icon = currentStatus.icon;

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-8 pr-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>
            {config.label}
          </option>
        ))}
      </select>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <Icon size={14} className={currentStatus.textColor} />
      </div>
    </div>
  );
}

export { STATUS_CONFIG };
