import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookMarked } from 'lucide-react';
import TodoList from './TodoList';
import AIInsightPanel from './AIInsightPanel';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function getTodayDate() {
  const d = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 星期${weekdays[d.getDay()]}`;
}

export default function TodayFocus({
  username,
  allNotes = [],
  onCreateNote,
  onVoiceInput,
  onNoteClick,
  onInsightAction,
}) {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // 统计
  const urgentCount = allNotes.filter(n => n.priority === 'urgent' && n.status !== 'done').length;
  const inProgressCount = allNotes.filter(n => n.status === 'in_progress').length;
  const todoCount = allNotes.filter(n => n.status === 'todo').length;
  const memoCount = allNotes.filter(n => n.status === 'note' || n.status === undefined || n.status === null).length;
  const pendingTodos = todoCount + inProgressCount;

  return (
    <div className="space-y-4">
      {/* Header: Greeting + Date + Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {getGreeting()}，<span className="text-accent">{username || '用户'}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            <Calendar size={13} className="inline mr-1 -mt-0.5" />
            {getTodayDate()} · 你有 {pendingTodos} 个待办事项需要关注
          </p>
        </div>
    
        {/* Quick Stats Pills — 始终显示4个固定标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/memos')}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
              bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
          >
            <BookMarked size={12} />
            {memoCount} 备忘
          </button>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
            bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            🔴 {urgentCount} 紧急
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
            bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            🟢 {inProgressCount} 进行中
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
            bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            🟡 {todoCount} 待办
          </span>
        </div>
      </div>

      {/* Grid: TodoList | AIInsightPanel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <TodoList notes={allNotes} onNoteClick={onNoteClick} />
        <AIInsightPanel allNotes={allNotes} onNoteClick={onNoteClick} onInsightAction={onInsightAction} />
      </div>
    </div>
  );
}
