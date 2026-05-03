import React from 'react';
import { Undo2 } from 'lucide-react';

export default function UndoToast({ note, countdown, onUndo }) {
  if (!note) return null;

  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (countdown / 5) * circumference;

  const title = note.title || '无标题笔记';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-gray-100
        text-white dark:text-gray-900 rounded-xl shadow-xl">
        <svg width="24" height="24" className="flex-shrink-0">
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
          />
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        <span className="text-sm">
          已删除 "{title}"
        </span>

        <button
          onClick={onUndo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white
            rounded-lg hover:bg-accent-600 transition-colors text-sm font-medium ml-2"
        >
          <Undo2 size={14} />
          撤销
        </button>
      </div>
    </div>
  );
}
