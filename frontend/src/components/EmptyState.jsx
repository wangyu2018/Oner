import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptyState({ onCreateNote }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-light text-gray-400 dark:text-gray-500 tracking-wide">
          记录此刻，轻如空气
        </h1>
        <p className="text-gray-400 dark:text-gray-600">
          开始记录你的第一个想法
        </p>
        <button
          onClick={onCreateNote}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white
            rounded-lg hover:bg-accent-600 transition-colors font-medium"
        >
          <Plus size={20} />
          新建备忘
        </button>
      </div>
    </div>
  );
}
