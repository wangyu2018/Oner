import React from 'react';
import { RefreshCw, Cloud, CloudOff } from 'lucide-react';

export default function SyncStatus({ lastSync, onRefresh, loading }) {
  // 格式化时间
  const formatTime = (date) => {
    if (!date) return '未同步';

    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return '刚刚同步';
    if (seconds < 60) return `${seconds} 秒前同步`;
    if (minutes < 60) return `${minutes} 分钟前同步`;

    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 检查是否在线
  const isOnline = navigator.onLine;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      {/* 网络状态 */}
      {isOnline ? (
        <Cloud size={14} className="text-green-500" />
      ) : (
        <CloudOff size={14} className="text-red-500" />
      )}

      {/* 同步时间 */}
      <span>{formatTime(lastSync)}</span>

      {/* 刷新按钮 */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="立即同步"
      >
        <RefreshCw
          size={14}
          className={`${loading ? 'animate-spin' : ''} text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}
        />
      </button>
    </div>
  );
}
