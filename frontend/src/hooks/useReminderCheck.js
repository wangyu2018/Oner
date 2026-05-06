import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

const CHECK_INTERVAL = 60000; // 60秒

export function useReminderCheck() {
  const [reminders, setReminders] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const isMountedRef = useRef(true);
  const intervalRef = useRef(null);

  const checkReminders = useCallback(async (forceShow = false) => {
    try {
      const res = await api.reminders.list();
      const { overdue, due_today } = res.data;

      // 只有过期和今天到期的才弹窗
      const urgent = [...overdue, ...due_today];
      if (urgent.length === 0) {
        if (isMountedRef.current) setReminders(null);
        return;
      }

      // 检查是否已经弹过这些提醒
      const shownIds = JSON.parse(
        localStorage.getItem('oner_shown_reminder_ids') || '[]'
      );
      const hasNew = urgent.some((r) => !shownIds.includes(r.id));

      if (isMountedRef.current) {
        setReminders(res.data);
        if (forceShow && hasNew) {
          setShowOverlay(true);
        }
      }
    } catch {
      // 静默失败（如网络问题）
    }
  }, []);

  // 页面加载时检查
  useEffect(() => {
    isMountedRef.current = true;

    // 延迟 1 秒加载，让页面先渲染
    const initTimer = setTimeout(() => checkReminders(true), 1000);

    intervalRef.current = setInterval(() => checkReminders(false), CHECK_INTERVAL);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkReminders]);

  // 窗口切换焦点时检查
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkReminders(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkReminders]);

  // 关闭浮层（标记已看过）
  const dismissOverlay = useCallback(() => {
    if (reminders) {
      const ids = [
        ...reminders.overdue.map((r) => r.id),
        ...reminders.due_today.map((r) => r.id),
      ];
      localStorage.setItem('oner_shown_reminder_ids', JSON.stringify(ids));
    }
    setShowOverlay(false);
  }, [reminders]);

  return { reminders, showOverlay, dismissOverlay, setShowOverlay };
}
