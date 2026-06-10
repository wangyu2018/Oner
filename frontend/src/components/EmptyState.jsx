import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptyState({ onCreateNote }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </div>
      <h2 className="empty-title">记录此刻，轻如空气</h2>
      <p className="empty-desc">开始记录你的第一个想法</p>
      <button onClick={onCreateNote} className="empty-btn">
        <Plus size={16} />
        新建备忘
      </button>
    </div>
  );
}
