import React from 'react';
import { RefreshCw, Cloud, CloudOff } from 'lucide-react';

export default function SyncStatus({ lastSync, onRefresh, loading }) {
  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    if (seconds < 10) return '刚刚';
    if (seconds < 60) return `${seconds}秒前`;
    if (minutes < 60) return `${minutes}分钟前`;
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const isOnline = navigator.onLine;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      {isOnline ? (
        <Cloud size={14} className="text-green-500" />
      ) : (
        <CloudOff size={14} className="text-red-500" />
      )}
      <span className="hidden sm:inline">{formatTime(lastSync)}</span>
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
