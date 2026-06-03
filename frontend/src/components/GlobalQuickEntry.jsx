import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowUp, X, FileText, Circle, Loader2 } from 'lucide-react';
import { matchKeywords, HIGHLIGHT_STYLES } from '../utils/keywordMatcher';
import { api } from '../utils/api';

export default forwardRef(function GlobalQuickEntry({ onCreateNote, onVoiceInput, categories = [], activeCategory = null, compact = false }, ref) {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('note');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const isComposing = useRef(false);
  const creatingRef = useRef(false);
  const debounceRef = useRef(null);

  // 搜索蒙版状态
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showOverlay, setShowOverlay] = useState(false);

  const keywords = text.trim() ? matchKeywords(text, categories) : null;

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    clear: () => {
      setText('');
      setStatus('note');
    },
  }));

  // 防抖搜索（输入时自动检索）
  useEffect(() => {
    if (!text.trim()) {
      setSearchResults([]);
      setSelectedIndex(-1);
      setShowOverlay(false);
      return;
    }
    setShowOverlay(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = { limit: 6 };
        if (activeCategory) params.category = activeCategory;
        const res = await api.search.query(text.trim(), params);
        setSearchResults(res.data.results || []);
        setSelectedIndex(-1);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [text, activeCategory]);

  // 点击外部关闭蒙版
  useEffect(() => {
    if (!showOverlay) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowOverlay(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showOverlay]);

  // 导航到搜索结果
  const handleSelectResult = useCallback((result) => {
    if (result.result_type === 'note') {
      navigate(`/note/${result.id}`);
    }
    setShowOverlay(false);
  }, [navigate]);

  // 创建笔记
  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || creatingRef.current) return;

    // 读取当前状态，立即清空输入（不等 API 返回，感觉更快）
    const data = {
      content: trimmed,
      status: keywords?.status || status,
      title: trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed,
      due_date: keywords?.date || undefined,
      priority: keywords?.priority || undefined,
      category: keywords?.category || activeCategory || undefined,
    };
    setText('');
    setStatus('note');
    setShowOverlay(false);

    creatingRef.current = true;
    setCreating(true);
    try {
      await onCreateNote(data);
      inputRef.current?.focus();
    } catch {
      // 错误由上层处理
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }, [text, status, keywords, onCreateNote, activeCategory]);

  // 键盘导航（搜索选择 + 创建）
  const handleKeyDown = useCallback((e) => {
    if (isComposing.current) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // 有搜索结果 → 选择（导航），无结果 → 创建
      if (showOverlay && searchResults.length > 0) {
        if (selectedIndex >= 0) {
          handleSelectResult(searchResults[selectedIndex]);
        } else {
          handleSelectResult(searchResults[0]);
        }
      } else {
        handleSubmit();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowOverlay(false);
    }
  }, [handleSubmit, searchResults, selectedIndex, handleSelectResult, showOverlay]);

  const handleCompositionStart = () => { isComposing.current = true; };
  const handleCompositionEnd = () => { isComposing.current = false; };

  const hasText = text.trim().length > 0;

  // 检测到的关键词标签
  const keywordChips = [];
  if (keywords) {
    if (keywords.remind) {
      const style = HIGHLIGHT_STYLES.remind;
      keywordChips.push({ label: style.label, color: style.textColor, bg: style.bgColor });
    }
    if (keywords.status) {
      const style = HIGHLIGHT_STYLES.status;
      keywordChips.push({ label: keywords.status === 'todo' ? '待办' : '备忘', color: style.textColor, bg: style.bgColor });
    }
    if (keywords.date) {
      const style = HIGHLIGHT_STYLES.date;
      const dateLabel = keywords.date.replace(/-/g, '/').slice(5);
      keywordChips.push({ label: dateLabel, color: style.textColor, bg: style.bgColor });
    }
    if (keywords.priority) {
      const style = HIGHLIGHT_STYLES.priority;
      keywordChips.push({ label: keywords.priority === 'urgent' ? '紧急' : '重要', color: style.textColor, bg: style.bgColor });
    }
    if (keywords.category) {
      keywordChips.push({ label: keywords.category, color: '#16a34a', bg: '#f0fdf4' });
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 搜索蒙版（浮在输入栏上方） */}
      {showOverlay && text.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2
          bg-white dark:bg-gray-900
          rounded-xl border border-gray-200 dark:border-gray-700
          shadow-xl shadow-black/10 dark:shadow-black/40
          overflow-hidden animate-slide-down">

          {/* 分类指示 */}
          {activeCategory && (
            <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[11px] font-medium text-green-700 dark:text-green-300">
                分类: {activeCategory}
              </span>
            </div>
          )}

          {/* 加载中 */}
          {searchLoading && (
            <div className="flex items-center justify-center py-5 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin mr-2" />
              搜索中...
            </div>
          )}

          {/* 搜索结果 */}
          {!searchLoading && searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((item, index) => (
                <button
                  key={`${item.result_type}-${item.id}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent-50 dark:bg-accent-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="shrink-0">
                    {item.result_type === 'note' ? (
                      item.status === 'todo'
                        ? <Circle size={14} className="text-yellow-500" />
                        : <FileText size={14} className="text-blue-500" />
                    ) : (
                      <FileText size={14} className="text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.title || '(无标题)'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.content?.slice(0, 60) || item.url || ''}
                    </div>
                  </div>
                  {item.category && (
                    <span className="text-[10px] text-green-600 dark:text-green-400 shrink-0 px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20">
                      {item.category}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 无结果 → 新建笔记提示 */}
          {!searchLoading && searchResults.length === 0 && (
            <button
              onClick={handleSubmit}
              className="w-full px-3 py-4 flex items-center justify-between
                hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                  <ArrowUp size={14} className="text-accent" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  未找到匹配任务，点击新建笔记
                </span>
              </div>
              <span className="text-[11px] text-gray-400">↵ 创建</span>
            </button>
          )}

          {/* 分类未选择时提示全量搜索 */}
          {!searchLoading && !activeCategory && searchResults.length > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] text-gray-400">
                ↑↓ 导航 · Enter 打开 · Esc 关闭 · 发送按钮直接创建笔记
              </span>
            </div>
          )}
        </div>
      )}

      {/* 关键词标签（检测到时显示） */}
      {!compact && keywordChips.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 overflow-x-auto scrollbar-none">
          {keywordChips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
              style={{ color: chip.color, backgroundColor: chip.bg }}
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {/* 主输入栏 */}
      <div className={`w-full bg-white/85 dark:bg-gray-900/85
        backdrop-blur-xl
        border-t md:border md:border-gray-200/60 md:dark:border-gray-700/60
        border-gray-200/70 dark:border-gray-800/70
        ${compact ? 'md:rounded-xl md:shadow-sm' : 'md:rounded-2xl md:shadow-lg md:shadow-black/10'}
        transition-all duration-200`}>
        <div className={`flex items-center gap-1.5 ${compact ? 'px-2 py-1' : 'px-3 py-2.5'}`}>
          {/* Status indicator (icon only) */}
          {!compact && (
            <button
              onClick={() => setStatus(s => s === 'note' ? 'todo' : 'note')}
              disabled={creating}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                (keywords?.status || status) === 'todo'
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              } ${creating ? 'opacity-50' : ''}`}
              title={status === 'note' ? '切换为待办' : '切换为备忘'}
            >
              {(keywords?.status || status) === 'todo' ? <Circle size={16} /> : <FileText size={16} />}
            </button>
          )}

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={text}
              disabled={creating}
              onChange={(e) => {
                const val = e.target.value;
                setText(val);
                const matched = matchKeywords(val, categories);
                if (matched.status) setStatus(matched.status);
              }}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={creating ? '创建中...' : (activeCategory ? `在「${activeCategory}」中搜索...` : '写点什么... 支持自然语言')}
              className={`w-full bg-gray-100/90 dark:bg-gray-800/90
                text-sm text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                border border-gray-200/50 dark:border-gray-700/50
                focus:border-accent/40 focus:ring-1 focus:ring-accent/30
                focus:bg-white/70 dark:focus:bg-gray-800/70
                outline-none transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
                ${compact ? 'px-3 py-1.5 rounded-lg' : 'px-4 py-2.5 rounded-xl'}`}
            />
            {hasText && !creating && (
              <button
                onClick={() => setText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1
                  rounded-full text-gray-400 hover:text-gray-600
                  dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700
                  transition-colors text-xs leading-none"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Voice / Send / Loading */}
          {creating ? (
            <div className={`flex-shrink-0 ${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl bg-accent/70 text-white
              flex items-center justify-center`}>
              <Loader2 size={compact ? 14 : 18} className="animate-spin" />
            </div>
          ) : hasText ? (
            <button
              onClick={handleSubmit}
              className={`flex-shrink-0 ${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl bg-accent text-white
                flex items-center justify-center active:scale-90 transition-transform
                shadow-sm shadow-accent/30 hover:bg-accent/90`}
              aria-label="发送"
            >
              <ArrowUp size={compact ? 14 : 18} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={onVoiceInput}
              className={`flex-shrink-0 ${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl
                bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400
                hover:bg-gray-200 dark:hover:bg-gray-700
                flex items-center justify-center active:scale-90 transition-all`}
              aria-label="语音输入"
            >
              <Mic size={compact ? 14 : 18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
