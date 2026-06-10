import React from 'react';
import { Trash2, Calendar, CheckCircle } from 'lucide-react';
import { RecurrenceBadge } from './RecurrenceSelector';
import { CategoryBadge } from './CategorySelector';
import { STATUS_CONFIG } from './StatusSelector';
import { getContentPreview, extractFirstLine } from '../utils/tags';

// Map status to CSS class name
const STATUS_CLASS = {
  note: 'memo',
  todo: 'todo',
  in_progress: 'progress',
  done: 'done',
};

export default function NoteCard({ note, onClick, onDelete, onTagClick }) {
  const title = note.title || extractFirstLine(note.content) || '无标题';
  const preview = getContentPreview(note.content, 120);
  const date = new Date(note.updated_at).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });

  // 状态配置
  const statusKey = note.status || 'note';
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.note;
  const StatusIcon = statusConfig.icon;
  const statusClass = STATUS_CLASS[statusKey] || 'memo';

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
  const isUrgent = note.priority === 'urgent';

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
      className={`note-card status-${statusClass} ${isUrgent ? 'animate-subtle-pulse' : ''}`}
    >
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className={`status-badge ${statusClass}`}>
            <StatusIcon size={11} />
            {statusConfig.label}
          </span>
          {note.priority !== 'normal' && (
            <span className={`priority-dot ${note.priority}`} />
          )}
          <RecurrenceBadge recurrence={note.recurrence} size="xs" />
          <CategoryBadge category={note.category} size="xs" />
        </div>
        <div className="card-actions">
          <button onClick={handleDelete} className="card-action-btn" title="删除">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        {preview && (
          <p className="card-preview">{preview}</p>
        )}

        {/* 截止日期 */}
        {note.due_date && (
          <div className={`due-date ${dueDateStatus === 'overdue' ? 'overdue' : dueDateStatus === 'today' ? 'today' : dueDateStatus === 'tomorrow' ? 'tomorrow' : ''}`}>
            <Calendar size={11} />
            <span>{formatDueDate()}</span>
            {dueDateStatus === 'overdue' && <span className="font-medium">(已过期)</span>}
            {dueDateStatus === 'today' && <span className="font-medium">(今天)</span>}
          </div>
        )}

        {/* 子任务进度 */}
        {note.subtask_total > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${((note.subtask_done || 0) / note.subtask_total) * 100}%`,
                  background: 'linear-gradient(90deg, var(--color-memo), hsl(240 81% 67%))',
                }}
              />
            </div>
            <span className="text-xs text-gray-400">{note.subtask_done || 0}/{note.subtask_total}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card-footer">
        <div className="card-tags">
          {note.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="card-tag"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
            >
              {tag}
            </span>
          ))}
          {note.tags?.length > 3 && (
            <span className="card-tag-more">+{note.tags.length - 3}</span>
          )}
        </div>
        <span className="card-updated">{date}</span>
      </div>
    </div>
  );
}
