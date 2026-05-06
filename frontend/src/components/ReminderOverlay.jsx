import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Clock, X } from 'lucide-react';

export default function ReminderOverlay({ reminders, onClose, onNoteClick }) {
  const [visible, setVisible] = useState(false);

  // 入场动画
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  if (!reminders) return null;

  const { overdue, due_today, due_tomorrow } = reminders;
  const hasUrgent = overdue.length > 0 || due_today.length > 0;

  if (!hasUrgent && due_tomorrow.length === 0) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full
          max-h-[80vh] overflow-y-auto transition-all duration-200 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              提醒事项
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 已过期 */}
          {overdue.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-red-500 mb-3">
                <Clock size={14} />
                已过期（{overdue.length}项）
              </h3>
              <div className="space-y-2">
                {overdue.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onNoteClick?.(item); handleClose(); }}
                    className="w-full text-left p-3 rounded-xl bg-red-50 dark:bg-red-900/20
                      border border-red-200 dark:border-red-800 hover:bg-red-100
                      dark:hover:bg-red-900/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 line-clamp-1">
                      {item.title || '无标题'}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      已过期 {item.days} 天
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 今天到期 */}
          {due_today.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-500 mb-3">
                <Calendar size={14} />
                今天到期（{due_today.length}项）
              </h3>
              <div className="space-y-2">
                {due_today.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onNoteClick?.(item); handleClose(); }}
                    className="w-full text-left p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20
                      border border-orange-200 dark:border-orange-800 hover:bg-orange-100
                      dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200 line-clamp-1">
                      {item.title || '无标题'}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      截止日期：今天
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 明天到期 */}
          {due_tomorrow.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-3">
                <Calendar size={14} />
                明天到期（{due_tomorrow.length}项）
              </h3>
              <div className="space-y-2">
                {due_tomorrow.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onNoteClick?.(item); handleClose(); }}
                    className="w-full text-left p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20
                      border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100
                      dark:hover:bg-yellow-900/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 line-clamp-1">
                      {item.title || '无标题'}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      截止日期：明天
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent-600
              transition-colors text-sm font-medium"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
