import React from 'react';
import { Sparkles, Calendar, BarChart3, Share2 } from 'lucide-react';

export default function AIInsightPanel({ allNotes = [], onNoteClick, onInsightAction }) {
  // 计算本周到期数量
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

  // 计算进行中数量
  const inProgress = allNotes.filter(n => n.status === 'in_progress' || n.status === 'todo').length;

  // 计算过期待办
  const overdue = allNotes.filter(n => {
    if (!n.due_date || n.status === 'done') return false;
    const due = new Date(n.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  // 计算总完成率
  const completed = allNotes.filter(n => n.status === 'done').length;
  const completionRate = allNotes.length > 0 ? Math.round((completed / allNotes.length) * 100) : 0;

  const insights = [
    {
      icon: Calendar,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      label: '到期提醒',
      desc: overdue > 0
        ? `「产品规划文档」已过期，建议调整截止日期或优先处理`
        : `本周还有 ${dueThisWeek} 条笔记待处理`,
      action: '→ 立即处理',
    },
    {
      icon: BarChart3,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      label: '本周概览',
      desc: `进行中 ${inProgress} 项 · 完成率 ${completionRate}% · 共 ${allNotes.length} 条笔记`,
      action: '→ 查看完整报告',
    },
    {
      icon: Share2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      label: '智能关联',
      desc: '发现多个待办项关联「项目」分类，建议整理为任务列表',
      action: '→ 打开关联笔记',
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
          onClick={() => onInsightAction?.(['view-overdue', 'view-statistics', 'organize-tasks'][i])}
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
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {item.desc}
          </p>
          <span className="text-[11px] font-medium text-accent mt-1.5 hover:text-accent-700 transition-colors cursor-pointer">
            {item.action}
          </span>
        </div>
      ))}
    </div>
  );
}
