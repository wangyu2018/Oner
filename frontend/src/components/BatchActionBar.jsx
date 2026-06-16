import React from 'react';
import { X, Trash2, CheckCircle, Circle, Clock, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'note', label: '备忘', icon: Circle, color: 'text-blue-500' },
  { value: 'todo', label: '待办', icon: Clock, color: 'text-amber-500' },
  { value: 'in_progress', label: '进行中', icon: ChevronUp, color: 'text-emerald-500' },
  { value: 'done', label: '已完成', icon: CheckCircle, color: 'text-gray-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: '低优', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  { value: 'normal', label: '普通', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'high', label: '高优', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'urgent', label: '紧急', color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
];

export default function BatchActionBar({
  count,
  onClear,
  onDelete,
  onUpdateStatus,
  onUpdatePriority,
}) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50
      bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg
      border-t border-gray-200 dark:border-gray-700
      shadow-[0_-4px_20px_rgba(0,0,0,0.1)]
      animate-[slideUp_0.2s_ease-out]
      safe-area-bottom"
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* 选中计数 */}
        <div className="flex items-center gap-2 min-w-[80px]">
          <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30
            flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400">
            {count}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">已选择</span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* 状态切换 */}
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => onUpdateStatus(value)}
              title={`设为${label}`}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors ${color}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        {/* 优先级 */}
        <div className="hidden sm:flex items-center gap-1">
          {PRIORITY_OPTIONS.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => onUpdatePriority(value)}
              title={`设为${label}`}
              className={`px-2 py-0.5 rounded text-[11px] font-medium
                transition-colors hover:opacity-80 ${color}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 弹性间距 */}
        <div className="flex-1" />

        {/* 删除 */}
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
            transition-colors text-xs font-medium"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">删除</span>
        </button>

        {/* 取消选择 */}
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
