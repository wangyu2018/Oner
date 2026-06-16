import React from 'react';
import { Plus, Search, AlertCircle, Loader2, FileX } from 'lucide-react';

/**
 * EmptyState 组件 - 四种变体
 * @param {'empty'|'loading'|'search'|'error'} variant - 变体类型
 * @param {Function} onCreateNote - 新建备忘回调 (empty 变体)
 * @param {Function} onRetry - 重试回调 (error 变体)
 * @param {Function} onClearSearch - 清除搜索回调 (search 变体)
 * @param {string} message - 自定义消息 (可选)
 */
export default function EmptyState({ variant = 'empty', onCreateNote, onRetry, onClearSearch, message }) {
  // 加载中骨架屏
  if (variant === 'loading') {
    return (
      <div className="empty-state">
        <div className="empty-icon" style={{ color: 'var(--accent, #4f46e5)' }}>
          <Loader2 size={32} className="animate-spin" />
        </div>
        <h2 className="empty-title">加载中...</h2>
        <p className="empty-desc">{message || '正在获取数据'}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4 px-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="shimmer-skeleton rounded-lg h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // 搜索无结果
  if (variant === 'search') {
    return (
      <div className="empty-state">
        <div className="empty-icon" style={{ color: '#9ca3af' }}>
          <Search size={32} />
        </div>
        <h2 className="empty-title">未找到匹配内容</h2>
        <p className="empty-desc">{message || '试试换个关键词搜索'}</p>
        {onClearSearch && (
          <button onClick={onClearSearch} className="empty-btn" style={{ background: 'var(--accent, #4f46e5)' }}>
            <Search size={16} />
            清除搜索
          </button>
        )}
      </div>
    );
  }

  // 错误重试
  if (variant === 'error') {
    return (
      <div className="empty-state">
        <div className="empty-icon" style={{ color: '#ef4444' }}>
          <AlertCircle size={32} />
        </div>
        <h2 className="empty-title">出了点问题</h2>
        <p className="empty-desc">{message || '加载失败，请稍后重试'}</p>
        {onRetry && (
          <button onClick={onRetry} className="empty-btn" style={{ background: '#ef4444' }}>
            <AlertCircle size={16} />
            重试
          </button>
        )}
      </div>
    );
  }

  // 默认空数据
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FileX size={32} />
      </div>
      <h2 className="empty-title">记录此刻，轻如空气</h2>
      <p className="empty-desc">{message || '开始记录你的第一个想法'}</p>
      {onCreateNote && (
        <button onClick={onCreateNote} className="empty-btn">
          <Plus size={16} />
          新建备忘
        </button>
      )}
    </div>
  );
}
