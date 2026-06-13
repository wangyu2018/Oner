import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Mic, ArrowUp, X, FileText, Circle, Loader2, Sparkles, Pencil, Trash2, Check } from 'lucide-react';
import { matchKeywords, HIGHLIGHT_STYLES, stripKeywords } from '../utils/keywordMatcher';
import { api } from '../utils/api';
import { usePluginManagerContext } from '../App';

export default forwardRef(function GlobalQuickEntry({
  onCreateNote, onVoiceInput, categories = [], activeCategory = null,
  compact = false, aiMode = false, onAISubmit, onNoteSelect
}, ref) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('note');
  const [creating, setCreating] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const isComposing = useRef(false);
  const creatingRef = useRef(false);
  const debounceRef = useRef(null);

  // 搜索蒙版
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showOverlay, setShowOverlay] = useState(false);

  // 润色预览卡片
  const [polishPreview, setPolishPreview] = useState(null); // { text, keywords }
  const [editingNote, setEditingNote] = useState(null); // 内联编辑的笔记
  const { isPluginActive } = usePluginManagerContext();
  const aiEnabled = isPluginActive?.('oner.plugin.ai') ?? true;

  // 预览卡片展开编辑
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState('note');

  const keywords = text.trim() ? matchKeywords(text, categories) : null;

  // 展开时初始化编辑字段（不使用 useEffect 避免依赖不稳定）
  const handleToggleExpand = useCallback(() => {
    if (!expanded) {
      const kw = keywords || matchKeywords(text.trim(), categories);
      const cleaned = stripKeywords(text.trim(), kw, categories) || text.trim();
      setEditTitle(cleaned.length > 50 ? cleaned.slice(0, 50) + '...' : cleaned);
      setEditContent(cleaned);
      setEditStatus(kw?.status || status);
    }
    setExpanded(e => !e);
  }, [expanded, text, status, categories]);

  useImperativeHandle(ref, () => ({
    focus: () => { inputRef.current?.focus(); },
    clear: () => { setText(''); setStatus('note'); setPolishPreview(null); setExpanded(false); },
  }));

  // 防抖搜索
  useEffect(() => {
    if (!text.trim() || polishPreview) {
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
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [text, activeCategory, polishPreview]);

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

  // 搜索结果点击 → 内联编辑（不跳转）
  const handleSelectResult = useCallback(async (result) => {
    if (result.result_type === 'note') {
      try {
        const res = await api.notes.get(result.id);
        setEditingNote(res.data);
      } catch {
        // 如果获取详情失败，fallback
      }
    }
    setShowOverlay(false);
    setText('');
  }, []);

  // 保存内联编辑
  const handleSaveEdit = useCallback(async () => {
    if (!editingNote) return;
    try {
      await api.notes.update(editingNote.id, {
        title: editingNote.title,
        content: editingNote.content,
        status: editingNote.status,
        category: editingNote.category,
      });
      setEditingNote(null);
    } catch { /* silent */ }
  }, [editingNote]);

  // 删除内联笔记
  const handleDeleteEdit = useCallback(async () => {
    if (!editingNote) return;
    try {
      await api.notes.delete(editingNote.id);
      setEditingNote(null);
    } catch { /* silent */ }
  }, [editingNote]);

  // 创建笔记
  const handleSubmit = useCallback(async (contentOverride) => {
    const trimmed = (contentOverride || text).trim();
    if (!trimmed || creatingRef.current) return;

    const kw = contentOverride ? matchKeywords(trimmed, categories) : keywords;
    // 浅层润色：去除已提取的关键词，避免正文冗余
    const cleanedContent = stripKeywords(trimmed, kw, categories);
    const data = {
      content: cleanedContent,
      status: kw?.status || status,
      title: cleanedContent.length > 50 ? cleanedContent.slice(0, 50) + '...' : cleanedContent,
      due_date: kw?.date || undefined,
      priority: kw?.priority || undefined,
      category: kw?.category || activeCategory || undefined,
    };
    setText('');
    setStatus('note');
    setShowOverlay(false);
    setPolishPreview(null);

    creatingRef.current = true;
    setCreating(true);
    try {
      if (aiMode && onAISubmit) {
        await onAISubmit(data);
      } else {
        await onCreateNote(data);
      }
      inputRef.current?.focus();
    } catch { /* */ }
    finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }, [text, status, keywords, onCreateNote, activeCategory, aiMode, onAISubmit, categories]);

  // 展开编辑后提交
  const handleEditSubmit = useCallback(async () => {
    const trimmed = editContent.trim();
    if (!trimmed || creatingRef.current) return;

    const kw = matchKeywords(trimmed, categories);
    const cleanedContent = stripKeywords(trimmed, kw, categories);
    const data = {
      content: cleanedContent,
      title: editTitle.trim() || cleanedContent.slice(0, 50),
      status: editStatus || kw?.status || 'note',
      category: kw?.category || keywords?.category || activeCategory || undefined,
      due_date: kw?.date || keywords?.date || undefined,
      priority: kw?.priority || keywords?.priority || undefined,
    };
    setText('');
    setStatus('note');
    setExpanded(false);
    setShowOverlay(false);
    setPolishPreview(null);

    creatingRef.current = true;
    setCreating(true);
    try {
      if (aiMode && onAISubmit) {
        await onAISubmit(data);
      } else {
        await onCreateNote(data);
      }
      inputRef.current?.focus();
    } catch { /* */ }
    finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }, [editContent, editTitle, editStatus, keywords, onCreateNote, activeCategory, aiMode, onAISubmit, categories]);

  // 润色 → 打开预览卡片
  const handlePolish = useCallback(async () => {
    if (polishing || !text.trim()) return;
    setPolishing(true);
    try {
      const res = await api.ai.analyze({ action: 'polish', content: text.trim() });
      const polished = res.data?.result?.trim();
      if (polished) {
        const kw = matchKeywords(polished, categories);
        setPolishPreview({ text: polished, keywords: kw });
      }
    } catch { /* 润色失败保持原文 */ }
    finally { setPolishing(false); }
  }, [polishing, text, categories]);

  // 键盘
  const handleKeyDown = useCallback((e) => {
    if (isComposing.current) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showOverlay && searchResults.length > 0) {
        if (selectedIndex >= 0) handleSelectResult(searchResults[selectedIndex]);
        else handleSelectResult(searchResults[0]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      if (polishPreview) setPolishPreview(null);
      else if (editingNote) setEditingNote(null);
      else setShowOverlay(false);
    }
  }, [handleSubmit, searchResults, selectedIndex, handleSelectResult, showOverlay, polishPreview, editingNote]);

  const handleCompositionStart = () => { isComposing.current = true; };
  const handleCompositionEnd = () => { isComposing.current = false; };

  const hasText = text.trim().length > 0;

  // 关键词标签
  const keywordChips = [];
  if (keywords) {
    if (keywords.remind) {
      const s = HIGHLIGHT_STYLES.remind;
      keywordChips.push({ label: s.label, color: s.textColor, bg: s.bgColor });
    }
    if (keywords.status) {
      const s = HIGHLIGHT_STYLES.status;
      keywordChips.push({ label: keywords.status === 'todo' ? '待办' : '备忘', color: s.textColor, bg: s.bgColor });
    }
    if (keywords.date) {
      const s = HIGHLIGHT_STYLES.date;
      keywordChips.push({ label: keywords.date.replace(/-/g, '/').slice(5), color: s.textColor, bg: s.bgColor });
    }
    if (keywords.priority) {
      const s = HIGHLIGHT_STYLES.priority;
      keywordChips.push({ label: keywords.priority === 'urgent' ? '紧急' : '重要', color: s.textColor, bg: s.bgColor });
    }
    if (keywords.category) {
      keywordChips.push({ label: keywords.category, color: '#16a34a', bg: '#f0fdf4' });
    }
  }

  // 润色预览的智能标签
  const renderPolishChips = (kw) => {
    if (!kw) return null;
    const chips = [];
    if (kw.status) {
      const s = HIGHLIGHT_STYLES.status;
      chips.push({ label: kw.status === 'todo' ? '待办' : '备忘', color: s.textColor, bg: s.bgColor });
    }
    if (kw.date) {
      const s = HIGHLIGHT_STYLES.date;
      chips.push({ label: kw.date.replace(/-/g, '/').slice(5), color: s.textColor, bg: s.bgColor });
    }
    if (kw.priority) {
      const s = HIGHLIGHT_STYLES.priority;
      chips.push({ label: kw.priority === 'urgent' ? '紧急' : '重要', color: s.textColor, bg: s.bgColor });
    }
    if (kw.category) {
      chips.push({ label: kw.category, color: '#16a34a', bg: '#f0fdf4' });
    }
    return chips;
  };

  return (
    <div ref={containerRef} className="relative w-full">

      {/* ====== 内联编辑面板 ====== */}
      {editingNote && (
        <div className="border-b border-accent/30 bg-accent/5 dark:bg-accent/10 p-3 animate-slide-down">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Pencil size={13} className="text-accent" />
              <span className="text-[11px] font-medium text-accent">编辑笔记</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteEdit}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="删除"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="关闭"
              >
                <X size={13} />
              </button>
            </div>
          </div>
          <input
            value={editingNote.title || ''}
            onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
            className="w-full text-sm font-medium bg-white/70 dark:bg-gray-800/50 rounded-lg px-3 py-1.5
              border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100
              focus:border-accent/50 outline-none transition-colors mb-2"
            placeholder="标题"
          />
          <textarea
            value={editingNote.content || ''}
            onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
            rows={3}
            className="w-full text-sm bg-white/70 dark:bg-gray-800/50 rounded-lg px-3 py-2
              border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100
              focus:border-accent/50 outline-none transition-colors resize-none"
            placeholder="内容"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                ${editingNote.status === 'todo'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  : editingNote.status === 'done'
                    ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                {editingNote.status === 'todo' ? '待办' : editingNote.status === 'done' ? '完成' : '备忘'}
              </span>
              {editingNote.category && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  {editingNote.category}
                </span>
              )}
            </div>
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium
                bg-accent text-white hover:bg-accent/90 active:scale-95 transition-all"
            >
              <Check size={12} /> 保存
            </button>
          </div>
        </div>
      )}

      {/* ====== 润色预览卡片 ====== */}
      {polishPreview && (
        <div className="border-b border-violet/30 bg-violet-50/50 dark:bg-violet-900/10 p-3 animate-slide-down">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-violet-500" />
              <span className="text-[11px] font-medium text-violet-600 dark:text-violet-400">润色预览</span>
            </div>
            <button
              onClick={() => setPolishPreview(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="取消"
            >
              <X size={13} />
            </button>
          </div>

          {/* 智能标签 */}
          {renderPolishChips(polishPreview.keywords)?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {renderPolishChips(polishPreview.keywords).map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                    border border-current/10"
                  style={{ color: chip.color, backgroundColor: chip.bg }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          )}

          {/* 可编辑内容 */}
          <textarea
            value={polishPreview.text}
            onChange={(e) => {
              const newText = e.target.value;
              const kw = matchKeywords(newText, categories);
              setPolishPreview({ text: newText, keywords: kw });
            }}
            rows={3}
            className="w-full text-sm bg-white/70 dark:bg-gray-800/50 rounded-lg px-3 py-2
              border border-violet-200 dark:border-violet-800/50
              text-gray-900 dark:text-gray-100
              focus:border-violet-400 outline-none transition-colors resize-none"
          />

          {/* 操作按钮 */}
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => { setText(polishPreview.text); setPolishPreview(null); }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              返回编辑
            </button>
            <button
              onClick={() => handleSubmit(polishPreview.text)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-violet-500 text-white hover:bg-violet-600 active:scale-95 transition-all"
            >
              <ArrowUp size={12} />
              {(polishPreview.keywords?.status || status) === 'todo' ? '创建待办' : '创建备忘'}
            </button>
          </div>
        </div>
      )}

      {/* ====== 搜索蒙版 ====== */}
      {showOverlay && text.trim() && !polishPreview && !editingNote && (
        <div className="absolute top-full left-0 right-0 mt-2
          bg-white dark:bg-gray-900 rounded-xl
          border border-gray-200 dark:border-gray-700
          shadow-xl shadow-black/10 dark:shadow-black/40
          overflow-hidden animate-slide-down z-10">

          {activeCategory && (
            <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[11px] font-medium text-green-700 dark:text-green-300">
                分类: {activeCategory}
              </span>
            </div>
          )}

          {searchLoading && (
            <div className="flex items-center justify-center py-5 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin mr-2" />搜索中...
            </div>
          )}

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
                      {item.content?.slice(0, 60) || ''}
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
                  未找到匹配，点击新建
                </span>
              </div>
              <span className="text-[11px] text-gray-400">↵ 创建</span>
            </button>
          )}

          <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <span className="text-[10px] text-gray-400">
              ↑↓ 导航 · Enter 打开编辑 · Esc 关闭
            </span>
          </div>
        </div>
      )}

      {/* ====== 主输入区（两层结构） ====== */}
      <div className="w-full">
        {/* 提示文字 */}
        {!hasText && !polishPreview && !editingNote && (
          <div className="px-3 pt-2.5 pb-1">
            <div className="text-[11px] text-gray-400/80 dark:text-gray-500/80 leading-relaxed">
              自然语言输入 · 支持日期、分类、优先级、标签
            </div>
          </div>
        )}

        {/* 输入框行 */}
        <div className="px-3 py-1.5">
          <div className="flex items-center gap-1.5">
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
                placeholder={
                  creating ? '创建中...' :
                  polishing ? '润色中...' :
                  polishPreview ? '预览中...' :
                  aiMode ? 'AI 帮你记录...' :
                  (activeCategory ? `在「${activeCategory}」中搜索...` : '写点什么... 支持自然语言')
                }
                className="w-full bg-gray-100/80 dark:bg-gray-800/80
                  text-sm text-gray-900 dark:text-gray-100
                  placeholder-gray-400/70 dark:placeholder-gray-500/70
                  border border-gray-200/60 dark:border-gray-700/60
                  focus:border-accent/40 focus:ring-1 focus:ring-accent/30
                  focus:bg-white/70 dark:focus:bg-gray-800/70
                  outline-none transition-all
                  disabled:opacity-60 disabled:cursor-not-allowed
                  px-4 py-2.5 rounded-xl"
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

            {/* AI 润色按钮 — AI 插件启用时显示 */}
            {hasText && !creating && !compact && aiEnabled && (
              <button
                onClick={handlePolish}
                disabled={polishing}
                className={`flex-shrink-0 p-2 rounded-xl transition-all
                  ${polishing
                    ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-400'
                  }`}
                title="AI 润色"
              >
                {polishing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              </button>
            )}

            {aiMode && !creating && (
              <div className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium">
                <Sparkles size={12} />AI
              </div>
            )}

            {creating ? (
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent/70 text-white flex items-center justify-center">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : hasText ? (
              <button
                onClick={handleSubmit}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent text-white
                  flex items-center justify-center active:scale-90 transition-transform
                  shadow-sm shadow-accent/30 hover:bg-accent/90"
                aria-label="发送"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>

        {/* ====== 实时可编辑预览卡片 ====== */}
        {hasText && keywordChips.length === 0 && !polishPreview && !editingNote && (
          <div className="px-3 pb-3 pt-0.5">
            <div className="p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                按 Enter 创建笔记，或继续输入以识别智能标签
              </p>
            </div>
          </div>
        )}

        {hasText && keywordChips.length > 0 && !polishPreview && !editingNote && (
          <div className="px-3 pb-3 pt-1 space-y-2">
            <div className="rounded-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden bg-white/70 dark:bg-gray-800/40">
              {/* 压缩视图 */}
              <div className="p-2.5">
                {/* 关键词标签 */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {keywordChips.map((chip, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
                        whitespace-nowrap border border-current/10"
                      style={{ color: chip.color, backgroundColor: chip.bg }}
                    >
                      {chip.label}
                    </span>
                  ))}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                    ${(keywords?.status || status) === 'todo'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                    {(keywords?.status || status) === 'todo' ? '待办' : '备忘'}
                  </span>
                </div>

                {/* 内容预览 */}
                <div className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/30 border border-gray-100/50 dark:border-gray-700/30 mb-2">
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                    {text.trim()}
                  </p>
                  {keywords?.category && (
                    <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
                      📂 {keywords.category}
                    </span>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/40">
                  <button
                    onClick={handleToggleExpand}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                      text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Pencil size={11} />
                    {expanded ? '收起' : '编辑'}
                  </button>
                  <button
                    onClick={expanded ? handleEditSubmit : handleSubmit}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium
                      bg-accent text-white hover:bg-accent/90 active:scale-95 transition-all shadow-sm shadow-accent/20"
                  >
                    <ArrowUp size={11} />
                    {(keywords?.status || status) === 'todo' ? '创建待办' : '创建备忘'}
                  </button>
                </div>
              </div>

              {/* 展开编辑区 */}
              {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-700/50 p-2.5 bg-gray-50/50 dark:bg-gray-900/30 space-y-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-sm font-medium bg-white/70 dark:bg-gray-800/50 rounded-lg px-3 py-1.5
                      border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100
                      focus:border-accent/50 outline-none transition-colors"
                    placeholder="标题（可选）"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full text-sm bg-white/70 dark:bg-gray-800/50 rounded-lg px-3 py-2
                      border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100
                      focus:border-accent/50 outline-none transition-colors resize-none"
                    placeholder="内容"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="text-xs bg-white/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5
                        text-gray-700 dark:text-gray-300 outline-none focus:border-accent/50"
                    >
                      <option value="note">备忘</option>
                      <option value="todo">待办</option>
                    </select>
                    {keywords?.category && (
                      <span className="text-[10px] px-1.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                        📂 {keywords.category}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
