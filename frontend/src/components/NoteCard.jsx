import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import TagChip from './TagChip';
import PriorityBadge from './PriorityBadge';
import { RecurrenceBadge } from './RecurrenceSelector';
import { CategoryBadge } from './CategorySelector';
import { STATUS_CONFIG } from './StatusSelector';
import { getContentPreview, extractFirstLine } from '../utils/tags';

export default function NoteCard({ note, onClick, onDelete, onTagClick }) {
  const title = note.title || extractFirstLine(note.content) || '无标题';
  const preview = getContentPreview(note.content, 120);
  const date = new Date(note.updated_at).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });

  // 状态配置
  const statusConfig = STATUS_CONFIG[note.status] || STATUS_CONFIG.note;
  const StatusIcon = statusConfig.icon;

  // 检查截止日期状态
  const getDueDateStatus = () => {
    if (!note.due_date) return null;
    const dueDate = new Date(note.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate < today) return 'overdue';
    if (dueDate.toDateString() === today.toDateString()) return 'today';
    if (dueDate.toDateString() === tomorrow.toDateString()) return 'tomorrow';
    return 'future';
  };

  const dueDateStatus = getDueDateStatus();

  const formatDueDate = () => {
    if (!note.due_date) return null;
    const date = new Date(note.due_date);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(note);
  };

  return (
    <div
      onClick={() => onClick(note)}
      className="group relative p-4 bg-white dark:bg-gray-900 rounded-xl border
        border-gray-200 dark:border-gray-800 hover:border-accent dark:hover:border-accent
        hover:shadow-md transition-all cursor-pointer"
    >
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 p-2 rounded-lg
          md:opacity-0 md:group-hover:opacity-100 md:hover:bg-red-50 md:dark:hover:bg-red-900/30
          text-gray-400 hover:text-red-500 transition-all"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <Trash2 size={16} />
      </button>

      {/* 状态和优先级指示器 */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${statusConfig.bgColor} ${statusConfig.textColor}`}>
          <StatusIcon size={10} />
          {statusConfig.label}
        </span>
        {note.priority !== 'normal' && (
          <PriorityBadge priority={note.priority} size="xs" showLabel={false} />
        )}
        <RecurrenceBadge recurrence={note.recurrence} size="xs" />
        <CategoryBadge category={note.category} size="xs" />
      </div>

      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 pr-8 line-clamp-2">
        {title}
      </h3>

      {preview && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">
          {preview}
        </p>
      )}

      {/* 截止日期 */}
      {note.due_date && (
        <div className={`flex items-center gap-1 text-xs mb-3 ${
          dueDateStatus === 'overdue'
            ? 'text-red-500'
            : dueDateStatus === 'today'
              ? 'text-orange-500'
              : dueDateStatus === 'tomorrow'
                ? 'text-yellow-600'
                : 'text-gray-500 dark:text-gray-400'
        }`}>
          <Calendar size={12} />
          <span>{formatDueDate()}</span>
          {dueDateStatus === 'overdue' && <span className="font-medium">(已过期)</span>}
          {dueDateStatus === 'today' && <span className="font-medium">(今天)</span>}
        </div>
      )}

      {/* 子任务进度 */}
      {note.subtask_total > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${(note.subtask_done / note.subtask_total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{note.subtask_done}/{note.subtask_total}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {note.tags?.slice(0, 3).map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
            />
          ))}
          {note.tags?.length > 3 && (
            <span className="text-xs text-gray-400">+{note.tags.length - 3}</span>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
      </div>
    </div>
  );
}
