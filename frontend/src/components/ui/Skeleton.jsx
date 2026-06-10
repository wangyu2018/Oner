import React from 'react';

const VARIANTS = {
  // 矩形占位（默认）
  rect: 'rounded-lg',
  // 圆形占位
  circle: 'rounded-full',
  // 文本行占位
  text: 'rounded h-4',
  // 标题占位
  title: 'rounded h-6',
  // 卡片占位
  card: 'rounded-xl',
  // 头像占位
  avatar: 'rounded-full',
  // 按钮占位
  button: 'rounded-lg',
};

export default function Skeleton({
  variant = 'rect',
  width,
  height,
  count = 1,
  className = '',
  lines = false,
  linesCount = 3,
}) {
  const baseClass = `
    bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100
    dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
    bg-[length:200%_100%]
    animate-shimmer
    ${VARIANTS[variant] || VARIANTS.rect}
  `;

  // 文本行模式
  if (lines) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: linesCount }).map((_, i) => (
          <div
            key={i}
            className={baseClass}
            style={{
              height: 12,
              width: i === linesCount - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  // 多重复模式
  if (count > 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={baseClass}
            style={{
              width: width || '100%',
              height: height || 16,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} ${className}`}
      style={{
        width: width || '100%',
        height: height || 16,
      }}
    />
  );
}

// 预定义的骨架屏模板
export function NoteCardSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
      {/* 状态徽章 */}
      <div className="flex gap-2">
        <Skeleton variant="button" width={48} height={18} />
        <Skeleton variant="button" width={32} height={18} />
      </div>
      {/* 标题 */}
      <Skeleton variant="title" width="75%" />
      {/* 内容预览 */}
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="85%" />
      {/* 底部标签 */}
      <div className="flex gap-2">
        <Skeleton variant="button" width={40} height={18} />
        <Skeleton variant="button" width={56} height={18} />
      </div>
    </div>
  );
}

export function KanbanCardSkeleton() {
  return (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
      <Skeleton variant="button" width={40} height={14} />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="60%" />
    </div>
  );
}

export function ChatBubbleSkeleton() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm space-y-2">
        <Skeleton lines linesCount={2} />
      </div>
    </div>
  );
}
