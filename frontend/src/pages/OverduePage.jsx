import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, CalendarDays, Pencil } from 'lucide-react';
import CommandBar from '../components/CommandBar';
import { api } from '../utils/api';

export default function OverduePage() {
  const navigate = useNavigate();
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.notes.list({}).then(res => {
      setAllNotes(res.data.notes || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // 按紧急度分组
  const grouped = useMemo(() => {
    const overdue = [];
    const todayDue = [];
    const tomorrowDue = [];
    const weekDue = [];

    allNotes.forEach(n => {
      if (!n.due_date || n.status === 'done') return;
      const due = new Date(n.due_date);
      due.setHours(0, 0, 0, 0);
      const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));

      if (diff < 0) overdue.push(n);
      else if (diff === 0) todayDue.push(n);
      else if (diff === 1) tomorrowDue.push(n);
      else if (diff <= 7) weekDue.push(n);
    });

    // 每组按到期日排序
    overdue.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    todayDue.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    tomorrowDue.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    weekDue.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    return { overdue, todayDue, tomorrowDue, weekDue };
  }, [allNotes, today]);

  const getOverdueDays = (dueDate) => {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.floor((today - due) / (1000 * 60 * 60 * 24));
  };

  const handleMarkDone = async (note) => {
    try {
      await api.notes.update(note.id, { status: 'done' });
      setAllNotes(prev => prev.map(n => n.id === note.id ? { ...n, status: 'done' } : n));
    } catch (e) {}
  };

  const handlePostpone = async (note) => {
    const newDate = new Date(note.due_date);
    newDate.setDate(newDate.getDate() + 3);
    try {
      await api.notes.update(note.id, { due_date: newDate.toISOString().slice(0, 10) });
      setAllNotes(prev => prev.map(n => n.id === note.id ? { ...n, due_date: newDate.toISOString().slice(0, 10) } : n));
    } catch (e) {}
  };

  const totalOverdue = grouped.overdue.length;
  const totalToday = grouped.todayDue.length;
  const totalTomorrow = grouped.tomorrowDue.length;
  const totalWeek = grouped.weekDue.length;
  const totalDue = totalOverdue + totalToday + totalTomorrow + totalWeek;

  // 过滤显示的数据
  const filteredSections = useMemo(() => {
    const all = [];
    if (activeTab === 'all' || activeTab === 'overdue') all.push({ key: 'overdue', label: '已过期', color: 'red', items: grouped.overdue });
    if (activeTab === 'all' || activeTab === 'today') all.push({ key: 'today', label: '今天到期', color: 'amber', items: grouped.todayDue });
    if (activeTab === 'all' || activeTab === 'tomorrow') all.push({ key: 'tomorrow', label: '明天到期', color: 'blue', items: grouped.tomorrowDue });
    if (activeTab === 'all' || activeTab === 'week') all.push({ key: 'week', label: '本周到期', color: 'slate', items: grouped.weekDue });
    return all.filter(s => s.items.length > 0);
  }, [activeTab, grouped]);

  const tabs = [
    { id: 'all', label: '全部', count: totalDue },
    { id: 'overdue', label: '已过期', count: totalOverdue },
    { id: 'today', label: '今天', count: totalToday },
    { id: 'tomorrow', label: '明天', count: totalTomorrow },
    { id: 'week', label: '本周', count: totalWeek },
  ].filter(t => t.id === 'all' || t.count > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CommandBar
        breadcrumb="到期提醒"
        showBack={true}
      />

      <main className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
        ) : (
          <>
            {/* Hero */}
            <div className="bg-gradient-to-r from-red-50 via-amber-50 to-blue-50
              dark:from-red-950/20 dark:via-amber-950/20 dark:to-blue-950/20
              border border-red-200 dark:border-red-800/40 rounded-2xl p-5 mb-4
              flex items-center gap-4 flex-wrap">
              <div>
                <div className="text-4xl font-black text-red-500 leading-none">{totalOverdue}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  项已过期，需立即处理
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {totalOverdue > 0 && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold
                    bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    🔴 已过期 {totalOverdue}
                  </span>
                )}
                {totalToday > 0 && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold
                    bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    🟡 今天到期 {totalToday}
                  </span>
                )}
                {totalTomorrow > 0 && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold
                    bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    🔵 明天到期 {totalTomorrow}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all
                    ${activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-accent shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Timeline */}
            {totalDue === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-green-50 dark:bg-green-900/20
                  flex items-center justify-center text-2xl">✅</div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">没有待处理的到期事项</p>
                <p className="text-xs text-gray-400 mt-1">所有事项都已完成或没有截止日期</p>
              </div>
            ) : (
              filteredSections.map(section => {
                const colorMap = {
                  red: { bg: 'bg-red-500', line: 'bg-red-200 dark:bg-red-800/40', border: 'border-red-200 dark:border-red-800/40', text: 'text-red-600 dark:text-red-400' },
                  amber: { bg: 'bg-amber-500', line: 'bg-amber-200 dark:bg-amber-800/40', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-600 dark:text-amber-400' },
                  blue: { bg: 'bg-blue-500', line: 'bg-blue-200 dark:bg-blue-800/40', border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-600 dark:text-blue-400' },
                  slate: { bg: 'bg-gray-400', line: 'bg-gray-200 dark:bg-gray-700', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-500 dark:text-gray-400' },
                };
                const c = colorMap[section.color];

                return (
                  <div key={section.key} className="mb-4">
                    <div className={`flex items-center gap-2 mb-3 text-xs font-bold ${c.text}`}>
                      <span className={`w-2 h-2 rounded-full ${c.bg}`}></span>
                      {section.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg.replace('bg-', 'bg-').replace('-500', '-100 dark:bg-').replace('-400', '')} ${c.text}`}>
                        {section.items.length}项
                      </span>
                    </div>

                    {section.items.map((note, idx) => {
                      const isLast = idx === section.items.length - 1;
                      const overdueDays = getOverdueDays(note.due_date);
                      const dueStr = new Date(note.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' });

                      return (
                        <div key={note.id} className="flex gap-4 relative">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center shrink-0" style={{ width: 12 }}>
                            <div className={`w-3 h-3 rounded-full ${c.bg} relative z-10`}></div>
                            {!isLast && (
                              <div className={`w-0.5 flex-1 ${c.line}`}></div>
                            )}
                          </div>

                          {/* Card */}
                          <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
                            <div className={`p-4 rounded-xl bg-white dark:bg-gray-900
                              border ${c.border} shadow-sm
                              hover:shadow-md transition-all cursor-pointer`}
                              onClick={() => navigate(`/note/${note.id}`)}
                            >
                              <div className={`text-[10px] mb-2 flex items-center gap-2 ${c.text}`}>
                                <span>{overdueDays > 0 ? `过期 ${overdueDays} 天` : overdueDays === 0 ? '今天到期' : `还有 ${-overdueDays} 天`}</span>
                                <span>·</span>
                                <span>{dueStr}</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                {note.title || note.content?.slice(0, 50) || '无标题'}
                              </p>
                              {note.content && note.title && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {note.content.slice(0, 80)}
                                </p>
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-2 mt-3 flex-wrap">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMarkDone(note); }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                                    bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400
                                    hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                >
                                  <Check size={12} /> 标记完成
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePostpone(note); }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                                    bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400
                                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <CalendarDays size={12} /> 延期3天
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/note/${note.id}`); }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                                    bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400
                                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Pencil size={12} /> 编辑
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </>
        )}
      </main>
    </div>
  );
}
