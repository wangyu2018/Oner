import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CommandBar from '../components/CommandBar';
import { api } from '../utils/api';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

// 获取本周一到周日
function getWeekDays() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function WeeklyPage() {
  const navigate = useNavigate();
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notes.list({}).then(res => {
      setAllNotes(res.data.notes || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const weekDays = useMemo(() => getWeekDays(), []);
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);

  const stats = useMemo(() => {
    if (!allNotes.length) return null;

    const completed = allNotes.filter(n => n.status === 'done').length;
    const inProgress = allNotes.filter(n => n.status === 'in_progress' || n.status === 'todo').length;
    const total = allNotes.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 本周完成数（按天）
    const weeklyCompleted = weekDays.map(day => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      return allNotes.filter(n =>
        n.status === 'done' &&
        n.updated_at && (() => {
          const u = new Date(n.updated_at);
          return u >= day && u < nextDay;
        })()
      ).length;
    });

    // 本周活跃度（按天）
    const weeklyActive = weekDays.map(day => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      return allNotes.filter(n => {
        if (!n.updated_at && !n.created_at) return false;
        const ts = new Date(n.updated_at || n.created_at);
        return ts >= day && ts < nextDay;
      }).length;
    });

    // 本周新增
    const weeklyNew = weekDays.reduce((sum, day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      return sum + allNotes.filter(n => {
        if (!n.created_at) return false;
        const c = new Date(n.created_at);
        return c >= day && c < nextDay;
      }).length;
    }, 0);

    // 上周完成率对比
    const lastWeekStart = new Date(weekDays[0]);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekDays[0]);
    const lastWeekCompleted = allNotes.filter(n => {
      if (n.status !== 'done' || !n.updated_at) return false;
      const u = new Date(n.updated_at);
      return u >= lastWeekStart && u < lastWeekEnd;
    }).length;

    const thisWeekCompletedTotal = weeklyCompleted.reduce((a, b) => a + b, 0);
    const trend = lastWeekCompleted > 0
      ? Math.round(((thisWeekCompletedTotal - lastWeekCompleted) / lastWeekCompleted) * 100)
      : thisWeekCompletedTotal > 0 ? 100 : 0;

    // 热力图级别 (0-4)
    const maxActive = Math.max(...weeklyActive, 1);
    const heatLevels = weeklyActive.map(v => Math.min(4, Math.round((v / maxActive) * 4)));

    // 过期待办
    const overdue = allNotes.filter(n => {
      if (!n.due_date || n.status === 'done') return false;
      return new Date(n.due_date) < today;
    }).length;

    // 进行中优先级分布
    const urgentInProgress = allNotes.filter(n => (n.status === 'in_progress' || n.status === 'todo') && n.priority === 'urgent').length;

    return {
      total, completed, inProgress, completionRate,
      weeklyCompleted, weeklyActive, heatLevels,
      weeklyNew, trend, thisWeekCompletedTotal,
      overdue, urgentInProgress,
    };
  }, [allNotes, weekDays, today]);

  // 获取当天是周几 (0=Sun, 1=Mon...)
  const todayDayIndex = (today.getDay() + 6) % 7; // 0=Mon, 6=Sun
  const isTodayPast = (idx) => idx < todayDayIndex;
  const isToday = (idx) => idx === todayDayIndex;

  const copyReport = (text) => {
    navigator.clipboard.writeText(text);
  };

  const aiReportText = stats ? `📌 本周亮点：${stats.completionRate >= 60 ? '完成率表现良好' : '本周完成率尚可'}（${stats.completionRate}%），${stats.thisWeekCompletedTotal > 3 ? `共完成 ${stats.thisWeekCompletedTotal} 项任务` : '建议加快进度'}。\n⚠️ 风险提示：${stats.overdue > 0 ? `${stats.overdue} 项事项已过期，建议今日内处理或延期。` : '暂无过期事项，继续保持。'}\n💡 下周建议：优先完成 ${stats.inProgress} 项进行中任务${stats.urgentInProgress > 0 ? `（含 ${stats.urgentInProgress} 项紧急），` : '，'}合理安排时间。` : '';

  const maxBar = stats ? Math.max(...stats.weeklyCompleted, 1) : 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CommandBar
        breadcrumb="本周概览"
        showBack={true}
      />

      <main className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
        ) : !stats ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl">📊</div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">暂无数据</p>
            <p className="text-xs text-gray-400 mt-1">创建笔记后，这里会显示本周的统计概览</p>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-lg mb-2">📋</div>
                <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.total}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">总事项</div>
                <div className={`text-[10px] font-semibold mt-1.5 ${stats.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {stats.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.trend)}% vs 上周
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-lg mb-2">✅</div>
                <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.completed}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">已完成</div>
                <div className="text-[10px] font-semibold mt-1.5 text-green-600 dark:text-green-400">↑ 完成率 {stats.completionRate}%</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-lg mb-2">⏳</div>
                <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.inProgress}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">进行中</div>
                <div className="text-[10px] font-semibold mt-1.5 text-amber-600 dark:text-amber-400">
                  {stats.urgentInProgress > 0 ? `⚠ 含 ${stats.urgentInProgress} 项紧急` : '需加快'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-lg mb-2">📝</div>
                <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.weeklyNew}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">新增备忘</div>
                <div className="text-[10px] font-semibold mt-1.5 text-blue-600 dark:text-blue-400">↑ 活跃度高</div>
              </div>
            </div>

            {/* Bar chart */}
            <div className="p-5 mb-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">📈 本周完成趋势</span>
                <span className="text-[10px] text-gray-400 font-normal">（按天）</span>
              </div>
              <div className="flex items-end gap-2 h-44">
                {stats.weeklyCompleted.map((val, i) => {
                  const height = val > 0 ? Math.max(20, (val / maxBar) * 100) : 0;
                  const isCurToday = isToday(i);
                  const isPast = isTodayPast(i);

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{val}</span>
                      {isCurToday && val === 0 ? (
                        <div className="w-full rounded-md border-2 border-dashed border-accent/50 bg-accent/5"
                          style={{ height: 24, minHeight: 24 }}></div>
                      ) : (
                        <div
                          className="w-full rounded-md transition-all cursor-pointer hover:opacity-80"
                          style={{
                            height: `${Math.max(height, val > 0 ? 20 : 4)}%`,
                            minHeight: val > 0 ? 20 : 4,
                            background: isPast
                              ? `linear-gradient(0deg, ${COLORS[i]}33, ${COLORS[i]})`
                              : val > 0 ? COLORS[i] : '#e5e7eb',
                          }}
                        ></div>
                      )}
                      <span className={`text-[10px] ${isCurToday ? 'font-bold text-accent' : 'text-gray-400'}`}>
                        {DAYS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap */}
            <div className="p-5 mb-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">🔥 每日活跃热力图</span>
                <span className="text-[10px] text-gray-400 font-normal">（颜色越深=当天创建/编辑越多）</span>
              </div>
              <div className="flex items-center gap-2 mb-4 text-[10px] text-gray-400">
                <span>少</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map(l => (
                    <div key={l} className="w-3.5 h-3.5 rounded"
                      style={{
                        background: l === 0 ? '#f3f4f6' : l === 1 ? '#fef3c7' : l === 2 ? '#fde68a' : l === 3 ? '#f59e0b' : '#d97706',
                        border: l === 0 ? '1px solid #e5e7eb' : 'none',
                      }}
                    ></div>
                  ))}
                </div>
                <span>多</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {stats.heatLevels.map((level, i) => (
                  <div key={i}
                    className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-110"
                    style={{
                      background: level === 0 ? '#f3f4f6' : level === 1 ? '#fef3c7' : level === 2 ? '#fde68a' : level === 3 ? '#f59e0b' : '#d97706',
                      color: level >= 3 ? 'white' : '#92400e',
                      border: level === 0 ? '1px solid #e5e7eb' : 'none',
                    }}
                    title={`${DAYS[i]}: ${stats.weeklyActive[i]} 条`}
                  >
                    {DAYS[i].charAt(0)}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Report */}
            <div className="p-5 rounded-xl mb-4
              bg-gradient-to-br from-violet-50 via-white to-indigo-50
              dark:from-violet-950/30 dark:via-gray-900 dark:to-indigo-950/30
              border border-violet-200 dark:border-violet-800/40 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600
                  flex items-center justify-center text-white text-[10px] shadow-sm">✦</span>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">AI 周报摘要</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-white/70 dark:bg-gray-800/70
                  text-violet-500 dark:text-violet-400 font-semibold">自动生成</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {aiReportText}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => copyReport(aiReportText)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold
                    bg-gradient-to-r from-violet-500 to-indigo-600 text-white
                    hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  📤 分享周报
                </button>
                <button
                  onClick={() => copyReport(aiReportText)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold
                    border border-violet-200 dark:border-violet-800/50
                    text-violet-600 dark:text-violet-400 bg-white dark:bg-gray-800
                    hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                >
                  📋 复制文本
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
