import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookMarked, TrendingUp } from 'lucide-react';
import TodoList from './TodoList';
import AIInsightPanel from './AIInsightPanel';
import { usePluginManagerContext } from '../App';

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
  onToggleStatus,
}) {
  const navigate = useNavigate();
  const { isPluginActive } = usePluginManagerContext();
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

  // 今日完成率
  const completionRate = useMemo(() => {
    const total = urgentCount + inProgressCount + todoCount;
    if (total === 0) return 100;
    const doneCount = allNotes.filter(n => n.status === 'done').length;
    return Math.round((doneCount / (total + doneCount)) * 100);
  }, [allNotes, urgentCount, inProgressCount, todoCount]);

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

        {/* 完成率 + 统计标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 完成率迷你进度 */}
          {pendingTodos > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
              bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
              <TrendingUp size={12} />
              <span>{completionRate}%</span>
              <div className="w-12 h-1.5 rounded-full bg-violet-200 dark:bg-violet-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
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
        <TodoList notes={allNotes} onNoteClick={onNoteClick} onToggleStatus={onToggleStatus} />
        {isPluginActive('oner.plugin.ai') && <AIInsightPanel allNotes={allNotes} onNoteClick={onNoteClick} onInsightAction={onInsightAction} />}
      </div>
    </div>
  );
}
