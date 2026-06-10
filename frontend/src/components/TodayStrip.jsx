import React, { useMemo } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';

// 默认分类色，从 CategorySelector 借用的模式移到这
const CATEGORY_PALETTE = {
  '工作': { color: '#3b82f6', light: '#eff6ff' },
  '学习': { color: '#a855f7', light: '#faf5ff' },
  '生活': { color: '#14b8a6', light: '#f0fdfa' },
  '项目': { color: '#f97316', light: '#fff7ed' },
};

function getCategoryStyle(category) {
  const palette = CATEGORY_PALETTE[category];
  if (palette) return { backgroundColor: palette.light, color: palette.color };
  return { backgroundColor: '#f1f5f9', color: '#64748b' };
}

function getDaysOverdue(dueDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
}

export default function TodayStrip({ notes = [], onNoteClick }) {
  const todayItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const items = notes.filter(n => n.status !== 'done' && n.status !== 'archived');
    
    // 评分排序：过期 > 今日到期 > 高优先 > 普通
    const scored = items.map(n => {
      let score = 0;
      const dueDate = n.due_date;
      const priority = n.priority || 'normal';

      if (dueDate) {
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < now) score += 100; // 过期
        else if (due.getTime() === now.getTime()) score += 80; // 今日
        else if (due < todayEnd && due.getDate() <= now.getDate() + 3) score += 40; // 3天内
      }

      if (priority === 'urgent') score += 60;
      else if (priority === 'high') score += 30;

      return { note: n, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(item => item.note);
  }, [notes]);

  if (todayItems.length === 0) return null;

  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-none glass-surface
      bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-red-50/20
      dark:from-amber-900/10 dark:via-orange-900/5 dark:to-red-900/5
      border-b border-gray-200/40 dark:border-gray-800/40">
      
      {/* 左侧标签 */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[56px] px-1">
        <span className="text-lg">🎯</span>
        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">今日</span>
        <span className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{todayItems.length}</span>
      </div>

      {/* 卡片列表 */}
      {todayItems.map(note => {
        const priority = note.priority || 'normal';
        const isUrgent = priority === 'urgent';
        const isHigh = priority === 'high';
        const dueDate = note.due_date;
        const daysOverdue = dueDate ? getDaysOverdue(dueDate) : 0;
        const isDueToday = dueDate && daysOverdue === 0;
        const isOverdue = dueDate && daysOverdue > 0;
        const catStyle = getCategoryStyle(note.category);
        const title = note.title || note.content?.split('\n')[0]?.slice(0, 40) || '无标题';
        const preview = note.content?.split('\n').slice(1).join(' ').slice(0, 60);

        return (
          <div
            key={note.id}
            onClick={() => onNoteClick?.(note)}
            className={`flex-shrink-0 min-w-[200px] max-w-[260px] rounded-[10px] p-3 border cursor-pointer
              transition-all hover:shadow-lg hover:-translate-y-1 hover:backdrop-blur-sm
              ${isOverdue
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border-l-[3px] border-l-red-500'
                : isDueToday
                ? 'bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-800 border-l-[3px] border-l-orange-500'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 border-l-[3px] border-l-accent'
              }`}
          >
            {/* 徽章 */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {isUrgent && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  紧急
                </span>
              )}
              {isHigh && !isUrgent && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                  高优先
                </span>
              )}
              {note.category && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={getCategoryStyle(note.category)}
                >
                  {note.category}
                </span>
              )}
            </div>

            {/* 标题 */}
            <h4 className="text-[12px] font-semibold text-gray-900 dark:text-white mb-1 leading-snug line-clamp-2">
              {title}
            </h4>

            {/* 预览 */}
            {preview && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">{preview}</p>
            )}

            {/* 截止日期 */}
            {dueDate && (
              <div className={`flex items-center gap-1 text-[11px] mt-1
                ${isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : ''}
                ${isDueToday ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''}
                ${!isOverdue && !isDueToday ? 'text-gray-400' : ''}
              `}>
                {isOverdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
                {isOverdue
                  ? `已过期 ${daysOverdue}天`
                  : isDueToday
                  ? '今日截止'
                  : new Date(dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
                }
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
