import React, { useState } from 'react';
import { Calendar, Trash2, ListTodo, Check } from 'lucide-react';
import { getContentPreview, extractFirstLine } from '../utils/tags';

// 视觉权重类名映射
function getWeightClass(note) {
  const p = note.priority || 'normal';
  const s = note.status || 'note';
  if (p === 'urgent') return 'urgent-large';
  if (s === 'in_progress' || p === 'high') return 'in-progress';
  if (s === 'done') return 'done-card';
  return 'normal';
}

function getDueStatus(note) {
  if (!note.due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(note.due_date);
  due.setHours(0, 0, 0, 0);
  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'future';
}

function SmartCard({ note, onClick, onDelete, batchMode, isSelected, onBatchClick, onLongPressStart, onLongPressEnd }) {
  const weight = getWeightClass(note);
  const title = note.title || extractFirstLine(note.content) || '无标题';
  const preview = getContentPreview(note.content, 80);
  const dueStatus = getDueStatus(note);
  const isUrgent = weight === 'urgent-large';
  const isDone = weight === 'done-card';

  const handleCardClick = (e) => {
    if (batchMode || e.ctrlKey || e.metaKey) {
      onBatchClick?.(note.id, e);
      return;
    }
    onClick(note);
  };

  // 状态徽章映射
  const badgeMap = {
    'note': { label: '备忘', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    'todo': { label: '待办', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    'in_progress': { label: '进行中', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'done': { label: '已完成', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  };
  const badge = badgeMap[note.status] || badgeMap.note;

  return (
    <div
      onClick={handleCardClick}
      onMouseDown={() => !batchMode && onLongPressStart?.(note.id)}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
      onTouchStart={() => !batchMode && onLongPressStart?.(note.id)}
      onTouchEnd={onLongPressEnd}
      className={`group relative bg-white dark:bg-gray-900 rounded-[10px] border p-3.5
        cursor-pointer transition-all duration-200 hover:-translate-y-0.5
        flex flex-col gap-2 overflow-hidden
        ${batchMode && isSelected ? 'ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-gray-950' : ''}
        ${isUrgent
          ? 'border-red-200/50 dark:border-red-900/30 col-span-2'
          : weight === 'in-progress'
            ? 'border-indigo-200/50 dark:border-indigo-900/30'
            : isDone
              ? 'border-gray-200/50 dark:border-gray-800 opacity-60'
              : 'border-gray-200/60 dark:border-gray-800'
        }
        ${isUrgent
          ? 'shadow-sm hover:shadow-md animate-[subtlePulse_3s_ease-in-out_infinite]'
          : 'shadow-xs hover:shadow-md'
        }
      `}
      style={{
        boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04))',
      }}
    >
      {/* 批量选择复选框 */}
      {batchMode && (
        <span className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
          ${isSelected
            ? 'bg-violet-500 border-violet-500 text-white'
            : 'border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80'
          }`}>
          {isSelected && <Check size={12} strokeWidth={3} />}
        </span>
      )}

      {/* 左侧指示条 */}
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm
        ${isUrgent ? 'bg-red-500' : ''}
        ${weight === 'in-progress' ? 'bg-indigo-500' : ''}
        ${weight === 'normal' ? 'bg-gray-300 dark:bg-gray-600' : ''}
        ${isDone ? 'bg-emerald-500' : ''}
      `} />

      {/* 删除按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete?.(note); }}
        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100
          hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all z-10"
      >
        <Trash2 size={12} />
      </button>

      {/* 徽章行 */}
      <div className="flex items-center gap-1.5 flex-wrap pr-6">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
        {note.priority === 'urgent' && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            紧急
          </span>
        )}
        {note.priority === 'high' && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            高优
          </span>
        )}
      </div>

      {/* 标题 */}
      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 line-clamp-2
        ${isUrgent ? 'text-[15px]' : 'text-[13px]'}
        ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : ''}
      `}>
        {title}
      </h3>

      {/* 预览 */}
      {preview && !isUrgent && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {preview}
        </p>
      )}

      {/* 子任务进度条 */}
      {note.subtask_total > 0 && (
        <div>
          <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600 transition-all"
              style={{ width: `${((note.subtask_done || 0) / note.subtask_total) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">
            {note.subtask_done || 0}/{note.subtask_total} 子任务
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
              {tag}
            </span>
          ))}
          {note.tags?.length > 2 && (
            <span className="text-[10px] text-gray-400">+{note.tags.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {dueStatus && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium
              ${dueStatus === 'overdue' ? 'text-red-500' : ''}
              ${dueStatus === 'today' ? 'text-amber-600' : ''}
              ${dueStatus === 'future' ? 'text-gray-400' : ''}
            `}>
              <Calendar size={9} />
              {new Date(note.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className="text-[10px] text-gray-400">
            {new Date(note.updated_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ========== 紧凑卡片（compact 视图） ==========
function CompactCard({ note, onClick, onDelete, batchMode, isSelected, onBatchClick }) {
  const title = note.title || extractFirstLine(note.content) || '无标题';
  const badgeMap = {
    'note': { label: '备忘', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    'todo': { label: '待办', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    'in_progress': { label: '进行中', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'done': { label: '已完成', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  };
  const badge = badgeMap[note.status] || badgeMap.note;
  return (
    <div
      onClick={(e) => {
        if (batchMode || e.ctrlKey || e.metaKey) { onBatchClick?.(note.id, e); return; }
        onClick(note);
      }}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer
        hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors
        ${batchMode && isSelected ? 'ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-gray-950' : ''}
      `}
    >
      {batchMode && (
        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${isSelected
            ? 'bg-violet-500 border-violet-500 text-white'
            : 'border-gray-300 dark:border-gray-600'
          }`}>
          {isSelected && <Check size={10} strokeWidth={3} />}
        </span>
      )}
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        note.priority === 'urgent' ? 'bg-red-500' :
        note.status === 'in_progress' ? 'bg-indigo-500' :
        note.status === 'done' ? 'bg-emerald-500' :
        'bg-gray-300 dark:bg-gray-600'
      }`} />
      <span className={`text-[13px] font-medium truncate flex-1 ${
        note.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
      }`}>
        {title}
      </span>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>
        {badge.label}
      </span>
    </div>
  );
}

export default function SmartCardGrid({
  notes = [], onNoteClick, onDelete, onTagClick,
  batchMode, isSelected, onBatchClick, onLongPressStart, onLongPressEnd,
  onSelectAll, selectedCount,
}) {
  const [viewMode, setViewMode] = useState('grid');
  if (notes.length === 0) return null;

  const viewOptions = [
    { value: 'grid', label: '▦ 网格' },
    { value: 'list', label: '☰ 列表' },
    { value: 'compact', label: '≡ 紧凑' },
  ];

  const isCompact = viewMode === 'compact';
  const isList = viewMode === 'list';

  return (
    <section className="pt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          📝 最近笔记
          <span className="text-xs font-normal text-gray-400">({notes.length})</span>
          {batchMode && (
            <span className="text-xs font-normal text-violet-500">
              · 已选 {selectedCount}
            </span>
          )}
        </h2>
        {/* 视图切换 */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
          {viewOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setViewMode(opt.value)}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                viewMode === opt.value
                  ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-xs'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Grid — 根据 viewMode 切换布局 */}
      <div className={`${
        isList || isCompact
          ? 'flex flex-col gap-0.5'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
      }`}>
        {notes.map((note) =>
          isCompact ? (
            <CompactCard
              key={note.id}
              note={note}
              onClick={onNoteClick}
              onDelete={onDelete}
              batchMode={batchMode}
              isSelected={isSelected?.(note.id)}
              onBatchClick={onBatchClick}
            />
          ) : (
            <SmartCard
              key={note.id}
              note={note}
              onClick={onNoteClick}
              onDelete={onDelete}
              batchMode={batchMode}
              isSelected={isSelected?.(note.id)}
              onBatchClick={onBatchClick}
              onLongPressStart={onLongPressStart}
              onLongPressEnd={onLongPressEnd}
            />
          )
        )}
      </div>
    </section>
  );
}
