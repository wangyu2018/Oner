import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Pen, Pin, PinOff, Sparkles, X } from 'lucide-react';
import GlobalQuickEntry from './GlobalQuickEntry';

const STORAGE_KEY_POS = 'floatingEntry_pos';
const STORAGE_KEY_PIN = 'floatingEntry_pinned';
const STORAGE_KEY_AI = 'floatingEntry_aiMode';

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export default function FloatingQuickEntry({
  onCreateNote, onVoiceInput, categories = [], activeCategory = null
}) {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(() => loadJSON(STORAGE_KEY_PIN, false));
  const [aiMode, setAiMode] = useState(() => loadJSON(STORAGE_KEY_AI, false));
  const [position, setPosition] = useState(() => {
    const saved = loadJSON(STORAGE_KEY_POS, null);
    if (saved) return saved;
    return { x: window.innerWidth - 420, y: window.innerHeight - 320 };
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const containerRef = useRef(null);

  // 持久化状态
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PIN, String(pinned)); }, [pinned]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_AI, String(aiMode)); }, [aiMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position)); }, [position]);

  // 窗口 resize 自动 clamp 边界
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      setPosition(prev => ({
        x: Math.max(10, Math.min(prev.x, window.innerWidth - w - 10)),
        y: Math.max(10, Math.min(prev.y, window.innerHeight - h - 10)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 拖拽开始
  const handlePointerDown = useCallback((e) => {
    if (pinned) return;
    if (e.target.closest('button')) return;
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      elemX: position.x,
      elemY: position.y,
    };
    setDragging(true);
  }, [pinned, position]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const el = containerRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const newX = Math.max(10, Math.min(dragRef.current.elemX + dx, window.innerWidth - w - 10));
    const newY = Math.max(10, Math.min(dragRef.current.elemY + dy, window.innerHeight - h - 10));
    setPosition({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current = null;
      setDragging(false);
    }
  }, []);

  // AI 自动分类提交
  const handleAISubmit = useCallback(async (noteData) => {
    try {
      const { api } = await import('../utils/api');
      const res = await api.ai.classify?.({ content: noteData.content });
      if (res?.data?.category) {
        noteData.category = res.data.category;
      }
    } catch { /* fallback */ }
    await onCreateNote(noteData);
  }, [onCreateNote]);

  const handleClose = () => {
    setExpanded(false);
  };

  // 折叠态：右下角小按钮
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed z-50 bottom-6 right-6 w-14 h-14 rounded-full
          bg-gradient-to-br from-accent-500 to-accent-600
          text-white shadow-lg shadow-accent/30
          hover:shadow-xl hover:shadow-accent/40 hover:scale-105
          active:scale-95
          flex items-center justify-center
          transition-all duration-200 ease-out
          ring-2 ring-white/20"
        title="快速输入"
      >
        <Pen size={22} strokeWidth={2} />
      </button>
    );
  }

  // 展开态：可移动+固定的完整面板
  return (
    <div
      ref={containerRef}
      style={{ left: position.x, top: position.y }}
      className={`fixed z-50 w-[380px] select-none ${
        dragging ? 'scale-[1.02] shadow-2xl' : 'shadow-xl'
      } rounded-xl transition-[shadow,transform] duration-150`}
    >
      {/* 拖拽手柄栏 */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex items-center justify-between px-3 py-1.5 rounded-t-xl ${
          pinned
            ? 'bg-accent/10 dark:bg-accent/20'
            : dragging
              ? 'bg-gray-200 dark:bg-gray-700 cursor-grabbing'
              : 'bg-gray-100 dark:bg-gray-800 cursor-grab hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {/* 拖拽指示器 */}
        <div className="flex flex-col gap-0.5 py-0.5">
          <div className="w-4 h-[2px] rounded-full bg-gray-400 dark:bg-gray-500" />
          <div className="w-4 h-[2px] rounded-full bg-gray-400 dark:bg-gray-500" />
          <div className="w-4 h-[2px] rounded-full bg-gray-400 dark:bg-gray-500" />
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setAiMode(a => !a); }}
            className={`p-1.5 rounded-md transition-colors ${
              aiMode
                ? 'text-accent bg-accent/10'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={aiMode ? 'AI 模式' : '普通模式'}
          >
            <Sparkles size={14} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setPinned(p => !p); }}
            className={`p-1.5 rounded-md transition-colors ${
              pinned
                ? 'text-accent'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={pinned ? '已固定' : '未固定'}
          >
            {pinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="p-1.5 rounded-md text-gray-400
              hover:text-gray-600 dark:hover:text-gray-300
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="收起"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* GlobalQuickEntry 区域 */}
      <div className="bg-white dark:bg-gray-900 rounded-b-xl border-x border-b border-gray-200 dark:border-gray-700 overflow-hidden">
        <GlobalQuickEntry
          onCreateNote={aiMode ? handleAISubmit : onCreateNote}
          onVoiceInput={onVoiceInput}
          categories={categories}
          activeCategory={activeCategory}
          aiMode={aiMode}
          onAISubmit={handleAISubmit}
        />
      </div>
    </div>
  );
}
