import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, BarChart3, Share2, AlertTriangle } from 'lucide-react';

export default function AIInsightPanel({ allNotes = [], onNoteClick, onInsightAction }) {
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const dueThisWeek = allNotes.filter(n => {
    if (!n.due_date || n.status === 'done') return false;
    const due = new Date(n.due_date);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= weekEnd;
  }).length;

  const inProgress = allNotes.filter(n => n.status === 'in_progress' || n.status === 'todo').length;

  const overdue = allNotes.filter(n => {
    if (!n.due_date || n.status === 'done') return false;
    const due = new Date(n.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const completed = allNotes.filter(n => n.status === 'done').length;
  const completionRate = allNotes.length > 0 ? Math.round((completed / allNotes.length) * 100) : 0;

  // 智能关联计数
  const categoryGroups = useMemo(() => {
    const groups = {};
    allNotes.filter(n => n.category && n.status !== 'done' && n.status !== 'archived').forEach(n => {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push(n);
    });
    return Object.entries(groups).filter(([, notes]) => notes.length >= 2);
  }, [allNotes]);

  const insights = [
    {
      icon: Calendar,
      iconBg: overdue > 0
        ? 'bg-red-50 dark:bg-red-900/20'
        : 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: overdue > 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-amber-600 dark:text-amber-400',
      label: '到期提醒',
      badge: overdue > 0 ? overdue : null,
      desc: overdue > 0
        ? `${overdue} 项已过期，建议调整截止日期或优先处理`
        : `本周还有 ${dueThisWeek} 条笔记待处理`,
      action: '→ 查看详情',
      route: '/ai/overdue',
    },
    {
      icon: BarChart3,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      label: '本周概览',
      desc: `进行中 ${inProgress} 项 · 完成率 ${completionRate}% · 共 ${allNotes.length} 条`,
      action: '→ 查看完整报告',
      route: '/ai/weekly',
    },
    {
      icon: Share2,
      iconBg: categoryGroups.length > 0
        ? 'bg-emerald-50 dark:bg-emerald-900/20'
        : 'bg-gray-50 dark:bg-gray-800',
      iconColor: categoryGroups.length > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-gray-400',
      label: '智能关联',
      badge: categoryGroups.length > 0 ? categoryGroups.length : null,
      desc: categoryGroups.length > 0
        ? `发现 ${categoryGroups.length} 组关联分类，建议整理为任务列表`
        : '暂未发现明显关联',
      action: categoryGroups.length > 0 ? '→ 打开关联笔记' : '',
      route: '/ai/associations',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/80
      dark:from-violet-950/30 dark:via-gray-900 dark:to-indigo-950/30
      rounded-[14px] border border-gray-200 dark:border-gray-800 shadow-sm p-4
      flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600
          flex items-center justify-center text-white text-[10px] shadow-sm"
        >
          <Sparkles size={12} />
        </span>
        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
          AI 洞察
        </span>
      </div>

      {/* Insight Cards */}
      {insights.map((item, i) => (
        <div
          key={i}
          onClick={() => {
            onInsightAction?.(['view-overdue', 'view-statistics', 'organize-tasks'][i]);
            navigate(item.route);
          }}
          className="p-3 rounded-[10px] bg-white/70 dark:bg-gray-800/40 backdrop-blur-sm
            border border-white/80 dark:border-gray-700/30
            cursor-pointer transition-all duration-150
            hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-sm hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.iconBg}`}>
              <item.icon size={14} className={item.iconColor} />
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
            {item.badge != null && item.badge > 0 && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full
                bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold">
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {item.desc}
          </p>
          {item.action && (
            <span className="text-[11px] font-medium text-accent mt-1.5 hover:text-accent-700 transition-colors cursor-pointer">
              {item.action}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
