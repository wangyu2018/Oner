import React, { useState, useMemo } from 'react';
import { Sparkles, Calendar, BarChart3, Share2, X, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import Modal from './ui/Modal';

export default function AIInsightPanel({ allNotes = [], onNoteClick, onInsightAction }) {
  const [activePopup, setActivePopup] = useState(null); // 'overdue' | 'report' | 'related'

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // 本周到期
  const dueThisWeekNotes = useMemo(() => allNotes.filter(n => {
    if (!n.due_date || n.status === 'done') return false;
    const due = new Date(n.due_date);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= weekEnd;
  }), [allNotes]);

  // 过期
  const overdueNotes = useMemo(() => allNotes.filter(n => {
    if (!n.due_date || n.status === 'done') return false;
    const due = new Date(n.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }), [allNotes]);

  // 进行中
  const inProgressNotes = useMemo(() => allNotes.filter(n => n.status === 'in_progress'), [allNotes]);
  const todoNotes = useMemo(() => allNotes.filter(n => n.status === 'todo'), [allNotes]);
  const completedNotes = useMemo(() => allNotes.filter(n => n.status === 'done'), [allNotes]);

  const completionRate = allNotes.length > 0 ? Math.round((completedNotes.length / allNotes.length) * 100) : 0;

  // 智能关联：按分类分组
  const categoryGroups = useMemo(() => {
    const groups = {};
    allNotes.filter(n => n.category && n.status !== 'done' && n.status !== 'archived').forEach(n => {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push(n);
    });
    return Object.entries(groups).filter(([, notes]) => notes.length >= 2).sort((a, b) => b[1].length - a[1].length);
  }, [allNotes]);

  const dueThisWeek = dueThisWeekNotes.length;
  const overdue = overdueNotes.length;
  const inProgress = inProgressNotes.length + todoNotes.length;

  const insights = [
    {
      id: 'overdue',
      icon: Calendar,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      label: '到期提醒',
      desc: overdue > 0
        ? `${overdue} 项已过期，建议调整截止日期或优先处理`
        : `本周还有 ${dueThisWeek} 条笔记待处理`,
      action: overdue > 0 ? '→ 查看过期项' : '→ 查看本周待办',
    },
    {
      id: 'report',
      icon: BarChart3,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      label: '本周概览',
      desc: `进行中 ${inProgress} 项 · 完成率 ${completionRate}% · 共 ${allNotes.length} 条`,
      action: '→ 查看完整报告',
    },
    {
      id: 'related',
      icon: Share2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      label: '智能关联',
      desc: categoryGroups.length > 0
        ? `发现 ${categoryGroups.length} 组关联分类，建议整理为任务列表`
        : '暂未发现明显关联',
      action: categoryGroups.length > 0 ? '→ 打开关联笔记' : '',
    },
  ];

  // 过期天数
  const getOverdueDays = (dueDate) => {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.floor((today - due) / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <div className="bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/80
        dark:from-violet-950/30 dark:via-gray-900 dark:to-indigo-950/30
        rounded-[14px] border border-gray-200 dark:border-gray-800 shadow-sm p-4
        flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600
            flex items-center justify-center text-white text-[10px] shadow-sm">
            <Sparkles size={12} />
          </span>
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">AI 洞察</span>
        </div>

        {insights.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if (item.id === 'overdue' || item.id === 'report' || item.id === 'related') {
                setActivePopup(item.id);
              }
              onInsightAction?.({ overdue: 'view-overdue', report: 'view-statistics', related: 'organize-tasks' }[item.id]);
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
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            {item.action && (
              <span className="text-[11px] font-medium text-accent mt-1.5 hover:text-accent-700 transition-colors cursor-pointer">
                {item.action}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ====== 到期提醒弹窗 ====== */}
      <Modal isOpen={activePopup === 'overdue'} onClose={() => setActivePopup(null)} title="到期提醒" size="md">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {overdueNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">已过期 ({overdueNotes.length})</span>
              </div>
              {overdueNotes.map(n => (
                <div key={n.id}
                  onClick={() => { setActivePopup(null); onNoteClick?.(n); }}
                  className="flex items-center justify-between p-3 mb-2 rounded-lg
                    bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50
                    cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {n.title || n.content?.slice(0, 40) || '无标题'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {n.category && <span className="mr-2">📂 {n.category}</span>}
                      过期 {getOverdueDays(n.due_date)} 天
                    </p>
                  </div>
                  <span className="text-xs font-bold text-red-500 shrink-0 ml-2">
                    {new Date(n.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {dueThisWeekNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">本周到期 ({dueThisWeekNotes.length})</span>
              </div>
              {dueThisWeekNotes.map(n => (
                <div key={n.id}
                  onClick={() => { setActivePopup(null); onNoteClick?.(n); }}
                  className="flex items-center justify-between p-3 mb-2 rounded-lg
                    bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50
                    cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {n.title || n.content?.slice(0, 40) || '无标题'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {n.category && <span className="mr-2">📂 {n.category}</span>}
                      {n.priority === 'urgent' && <span className="text-red-500 font-medium">紧急</span>}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                    {new Date(n.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {overdueNotes.length === 0 && dueThisWeekNotes.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
              <p className="text-sm">没有待处理的到期笔记</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ====== 本周概览弹窗 ====== */}
      <Modal isOpen={activePopup === 'report'} onClose={() => setActivePopup(null)} title="本周概览报告" size="md">
        <div className="space-y-4">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/30">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{allNotes.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">总笔记数</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/30">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completionRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">完成率</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/30">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{inProgress}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">进行中</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-800/30">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdue}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">已过期</p>
            </div>
          </div>

          {/* 进度条 */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">完成进度</span>
              <span className="text-xs text-gray-400">{completedNotes.length}/{allNotes.length}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* 待办明细 */}
          {todoNotes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">待办事项 ({todoNotes.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {todoNotes.slice(0, 8).map(n => (
                  <div key={n.id}
                    onClick={() => { setActivePopup(null); onNoteClick?.(n); }}
                    className="flex items-center gap-2 p-2 rounded-lg cursor-pointer
                      hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      n.priority === 'urgent' ? 'bg-red-500' : n.priority === 'high' ? 'bg-orange-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                      {n.title || n.content?.slice(0, 40) || '无标题'}
                    </span>
                    {n.due_date && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(n.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ====== 智能关联弹窗 ====== */}
      <Modal isOpen={activePopup === 'related'} onClose={() => setActivePopup(null)} title="智能关联" size="md">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {categoryGroups.length > 0 ? (
            categoryGroups.map(([category, notes]) => (
              <div key={category} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📂</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{category}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {notes.length} 条关联
                  </span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notes.slice(0, 5).map(n => (
                    <div key={n.id}
                      onClick={() => { setActivePopup(null); onNoteClick?.(n); }}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer
                        hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        n.status === 'todo' ? 'bg-orange-400' :
                        n.status === 'in_progress' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                          {n.title || n.content?.slice(0, 40) || '无标题'}
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        n.status === 'todo'
                          ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400'
                          : n.status === 'in_progress'
                            ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {n.status === 'todo' ? '待办' : n.status === 'in_progress' ? '进行中' : '备忘'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Share2 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂未发现明显的关联分类</p>
              <p className="text-xs mt-1">给笔记添加分类后，这里会显示智能关联建议</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
