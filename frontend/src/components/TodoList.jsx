import React from 'react';
import { Calendar, ListTodo } from 'lucide-react';

function getDueCategory(note) {
  if (!note.due_date) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(note.due_date);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((due - today) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 3) return 'upcoming';
  return null;
}

export default function TodoList({ notes = [], onNoteClick, onToggleStatus }) {
  // 筛选出待办/进行中且有截止日期的笔记
  const todos = notes
    .filter(n => (n.status === 'todo' || n.status === 'in_progress') && n.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const overdue = todos.filter(n => getDueCategory(n) === 'overdue');
  const today = todos.filter(n => getDueCategory(n) === 'today');
  const upcoming = todos.filter(n => getDueCategory(n) === 'upcoming');

  const totalCount = overdue.length + today.length + upcoming.length;

  if (totalCount === 0) return null;

  function renderItem(note) {
    const cat = getDueCategory(note);
    const title = note.title || '无标题';
    const tagColorMap = {
      '工作': 'bg-blue-50 text-blue-600',
      '学习': 'bg-emerald-50 text-emerald-600',
      'urgent': 'bg-red-50 text-red-600',
    };

    const handleCircleClick = (e) => {
      e.stopPropagation();
      onToggleStatus?.(note.id, note.status === 'done' ? 'todo' : 'done');
    };

    return (
      <div
        key={note.id}
        onClick={() => onNoteClick(note)}
        className={`flex items-start gap-2.5 p-3 rounded-[10px] cursor-pointer
          transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50
          ${cat === 'overdue' ? 'border-l-[3px] border-red-500 pl-[calc(0.75rem-3px)]' : ''}
          ${cat === 'today' ? 'border-l-[3px] border-amber-500 pl-[calc(0.75rem-3px)]' : ''}
          ${cat === 'upcoming' ? 'border-l-[3px] border-gray-300 dark:border-gray-600 pl-[calc(0.75rem-3px)]' : ''}
        `}
      >
        {/* 复选框 — 点击切换完成状态 */}
        <button
          onClick={handleCircleClick}
          className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 mt-0.5
            transition-all cursor-pointer flex items-center justify-center
            ${note.status === 'done'
              ? 'bg-accent border-accent text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-accent hover:bg-accent-50 dark:hover:border-accent-400 dark:hover:bg-accent-900/20'
            }`}
          title={note.status === 'done' ? '标记为未完成' : '标记为已完成'}
        >
          {note.status === 'done' && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
            {title}
          </p>

          {/* Meta 行 */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* 截止日期 */}
            <span className={`inline-flex items-center gap-1 text-[11px] ${
              cat === 'overdue' ? 'text-red-500 font-medium' :
              cat === 'today' ? 'text-amber-600 font-medium' :
              'text-gray-400'
            }`}>
              <Calendar size={10} />
              {new Date(note.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              {cat === 'overdue' && ' (已过期)'}
              {cat === 'today' && ' (今天)'}
            </span>

            {/* 标签 */}
            {note.tags?.slice(0, 2).map(tag => (
              <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                ${tagColorMap[tag] || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {tag}
              </span>
            ))}

            {/* 子任务进度 */}
            {note.subtask_total > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                <ListTodo size={10} />
                {note.subtask_done || 0}/{note.subtask_total}
              </span>
            )}
          </div>
        </div>

        {/* 优先级圆点 */}
        {note.priority === 'urgent' && (
          <span className="w-[6px] h-[6px] rounded-full bg-red-500 flex-shrink-0 mt-2" />
        )}
        {note.priority === 'high' && (
          <span className="w-[6px] h-[6px] rounded-full bg-amber-500 flex-shrink-0 mt-2" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[14px] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          今日待办
        </h3>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
          {totalCount} 项
        </span>
      </div>

      {/* List — 用左边框颜色区分，移除分组标题 */}
      <div className="p-2">
        {overdue.map(renderItem)}
        {today.map(renderItem)}
        {upcoming.map(renderItem)}
      </div>
    </div>
  );
}
