import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { FileText, Circle, Loader, CheckCircle, LayoutList } from 'lucide-react';
import NoteCard from './NoteCard';

const STATUS_TABS = [
  { id: '',      label: '全部',     icon: LayoutList,   color: 'text-gray-500' },
  { id: 'note',  label: '备忘',     icon: FileText,     color: 'text-blue-500' },
  { id: 'todo',  label: '待办',     icon: Circle,       color: 'text-orange-500' },
  { id: 'in_progress', label: '进行中', icon: Loader,   color: 'text-yellow-500' },
  { id: 'done',  label: '已完成',   icon: CheckCircle,  color: 'text-green-500' },
];

const SWIPE_THRESHOLD = 40;

export default function SwipeStatusTabs({
  allNotes,
  activeStatus,
  onStatusChange,
  onNoteClick,
  onDelete,
  onTagClick,
  onCreateNote,
}) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef(null);
  const isAnimating = useRef(false);

  const activeIndex = useMemo(
    () => STATUS_TABS.findIndex(t => t.id === activeStatus),
    [activeStatus]
  );

  // Ref always mirrors the last committed activeIndex
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // Filter notes per tab
  const pageNotes = useMemo(() => {
    return STATUS_TABS.map(tab => {
      if (tab.id === '') return allNotes;
      return allNotes.filter(n => (n.status || 'note') === tab.id);
    });
  }, [allNotes]);

  // Viewport width tracking
  const viewportWidth = useRef(typeof window !== 'undefined' ? window.innerWidth : 375);
  useEffect(() => {
    const handleResize = () => { viewportWidth.current = window.innerWidth; };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigate to a page by index
  const goToPage = useCallback((index) => {
    if (isAnimating.current) return;
    if (index < 0 || index >= STATUS_TABS.length) return;
    if (index === activeIndexRef.current) return;

    isAnimating.current = true;
    activeIndexRef.current = index;

    setTimeout(() => { isAnimating.current = false; }, 300);
    onStatusChange(STATUS_TABS[index].id);
  }, [onStatusChange]);

  // Compute translateX directly from ref + drag state
  const translateX = useMemo(() => {
    const base = -activeIndexRef.current * 100;
    if (isDragging && touchStart !== null) {
      // Use activeIndex state during drag so the base tracks the committed active page
      const currentBase = -activeIndex * 100;
      const offsetPct = (touchDelta / viewportWidth.current) * 100;
      return `translateX(calc(${currentBase}% + ${offsetPct}%))`;
    }
    return `translateX(${base}%)`;
  }, [activeIndex, isDragging, touchStart, touchDelta]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (isAnimating.current) return;
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStart === null || isAnimating.current) return;
    const diff = e.touches[0].clientX - touchStart;

    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }

    // Rubber-band at edges for feedback
    const atFirst = activeIndex === 0 && diff > 0;
    const atLast = activeIndex === STATUS_TABS.length - 1 && diff < 0;
    const clamped = atFirst || atLast ? diff * 0.3 : diff;

    setTouchDelta(clamped);
  }, [touchStart, activeIndex]);

  const handleTouchEnd = useCallback(() => {
    if (touchStart === null || isAnimating.current) {
      setIsDragging(false);
      setTouchStart(null);
      setTouchDelta(0);
      return;
    }

    const absDelta = Math.abs(touchDelta);
    const direction = touchDelta > 0 ? -1 : 1;

    if (absDelta > SWIPE_THRESHOLD) {
      const targetIndex = activeIndex + direction;
      if (targetIndex >= 0 && targetIndex < STATUS_TABS.length) {
        goToPage(targetIndex);
        setIsDragging(false);
        setTouchStart(null);
        setTouchDelta(0);
        return;
      }
    }

    setIsDragging(false);
    setTouchStart(null);
    setTouchDelta(0);
  }, [touchStart, touchDelta, activeIndex, goToPage]);

  return (
    <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* ===== 顶部标签栏 ===== */}
      <div className="flex-shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-800/70">
        <div className="flex overflow-x-auto scrollbar-hide px-1" style={{ scrollbarWidth: 'none' }}>
          {STATUS_TABS.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeStatus;
            const count = pageNotes[i].length;

            return (
              <button
                key={tab.id}
                onClick={() => goToPage(i)}
                className={`
                  flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap
                  transition-all relative flex-shrink-0 select-none
                  ${isActive
                    ? 'text-accent'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{tab.label}</span>
                <span className={`
                  text-[10px] px-1.5 py-0.5 rounded-full leading-none
                  ${isActive
                    ? 'bg-accent/10 text-accent'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }
                `}>
                  {count}
                </span>

                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 可滑动内容区域 (页面容器) ===== */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full"
          style={{
            width: `${STATUS_TABS.length * 100}%`,
            transform: translateX,
            willChange: 'transform',
            transition: isDragging
              ? 'none'
              : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {STATUS_TABS.map((tab, i) => (
            <div
              key={tab.id}
              className="h-full overflow-y-auto px-3 pb-4"
              style={{ width: `${100 / STATUS_TABS.length}%` }}
            >
              {pageNotes[i].length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className={`${tab.color} opacity-30 mb-3`}>
                    <tab.icon size={48} strokeWidth={1} />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                    {tab.id === '' ? '还没有内容，新建一条吧' :
                     tab.id === 'note' ? '还没有备忘' :
                     tab.id === 'todo' ? '还没有待办' :
                     tab.id === 'in_progress' ? '还没有进行中的任务' :
                     '还没有已完成的任务'}
                  </p>
                  <button
                    onClick={onCreateNote}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium"
                  >
                    新建
                  </button>
                </div>
              ) : (
                <div className="pt-3 space-y-3">
                  {pageNotes[i].map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onClick={onNoteClick}
                      onDelete={onDelete}
                      onTagClick={onTagClick}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== 底部 iOS 风格页面指示点 ===== */}
      <div className="flex-shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
        border-t border-gray-200/70 dark:border-gray-800/70">
        <div className="flex items-center justify-center py-2 gap-2">
          {STATUS_TABS.map((tab, i) => {
            const isActive = tab.id === activeStatus;
            return (
              <button
                key={tab.id}
                onClick={() => goToPage(i)}
                className={`rounded-full transition-all duration-500 ease-out ${
                  isActive
                    ? 'w-7 h-2 bg-accent shadow-sm shadow-accent/40'
                    : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={tab.label}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
