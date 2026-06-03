import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, MicOff, ArrowUp, FileText, Circle, X, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { matchKeywords, getHighlightRanges, HIGHLIGHT_STYLES } from '../utils/keywordMatcher';

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function CommandPalette({ isOpen, onClose, categories = [], onCreateNote }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const debounceRef = useRef(null);

  const [keywords, setKeywords] = useState(null);

  // 搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      setKeywords(null);
      return;
    }

    // 关键词匹配（本地）
    const matched = matchKeywords(query, categories);
    setKeywords(matched);

    // 防抖搜索
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search.query(query, { limit: 8 });
        setResults(res.data.results);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, categories]);

  // 自动聚焦
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setKeywords(null);
    }
  }, [isOpen]);

  // Esc 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (isListening) stopListening();
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isListening, onClose]);

  // 语音识别
  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return;
    setIsListening(true);
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        final += e.results[i][0].transcript;
      }
      setQuery(final);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // 提交 - 创建笔记
  const handleCreate = useCallback(() => {
    const text = query.trim();
    if (!text) return;

    const parsed = matchKeywords(text, categories);
    const tags = parsed.category ? [parsed.category] : [];
    const title = text.length > 50 ? text.slice(0, 50) + '...' : text;

    onCreateNote({
      content: text,
      title,
      status: parsed.status || 'note',
      priority: parsed.priority || undefined,
      due_date: parsed.date || undefined,
      tags,
    });

    onClose();
  }, [query, categories, onCreateNote, onClose]);

  // 选择结果
  const handleSelect = useCallback((result) => {
    if (result.result_type === 'note') {
      navigate(`/note/${result.id}`);
    } else if (result.result_type === 'password_entry') {
      navigate('/passwords');
    }
    onClose();
  }, [navigate, onClose]);

  // 键盘导航
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && selectedIndex >= 0) {
        // 选择了搜索结果
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0 && selectedIndex < 0) {
        // 没有选择任何结果，默认选第一个
        handleSelect(results[0]);
      } else {
        // 无结果，直接创建
        handleCreate();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    }
  };

  // 高亮渲染
  const renderHighlightedText = (text) => {
    const ranges = getHighlightRanges(text, categories);
    if (ranges.length === 0) return text;

    const parts = [];
    let lastEnd = 0;
    const used = new Set();

    for (const r of ranges) {
      const key = `${r.start}-${r.end}`;
      if (used.has(key)) continue;
      used.add(key);

      if (r.start > lastEnd) {
        parts.push(text.slice(lastEnd, r.start));
      }
      const style = HIGHLIGHT_STYLES[r.type] || {};
      parts.push(
        <span key={key} className="relative group" style={{ fontWeight: 600 }}>
          {text.slice(r.start, r.end)}
          <span
            className="absolute -top-5 left-0 text-[10px] px-1 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: style.bgColor || '#e5e7eb', color: style.textColor || '#374151' }}
          >
            {style.label || r.type}
          </span>
        </span>
      );
      lastEnd = r.end;
    }
    if (lastEnd < text.length) {
      parts.push(text.slice(lastEnd));
    }
    return parts;
  };

  const showCreateHint = query.trim() && !loading && results.length === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-[15vh] max-w-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 输入框 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            {/* 语音按钮 */}
            <button
              onClick={toggleListening}
              className={`p-2 rounded-full mr-2 transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={isListening ? '停止录音' : '语音录入'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* 文本输入 */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索笔记... 或直接输入内容创建"
              className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-base outline-none placeholder-gray-400"
            />

            {/* 提交按钮 */}
            {query.trim() && (
              <button
                onClick={handleCreate}
                className="ml-2 p-2 rounded-full bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                title="快速创建"
              >
                <ArrowUp size={16} />
              </button>
            )}

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="ml-1 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* 关键词预览 */}
          {keywords && query.trim() && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <div className="text-sm whitespace-pre-wrap">
                {renderHighlightedText(query)}
              </div>
              {/* 关键词提示标签 */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {keywords.date && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    日期: {keywords.date}
                  </span>
                )}
                {keywords.status && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    状态: {keywords.status === 'todo' ? '待办' : '备忘'}
                  </span>
                )}
                {keywords.priority && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    优先级: {keywords.priority}
                  </span>
                )}
                {keywords.remind && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    需提醒
                  </span>
                )}
                {keywords.category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    分类: {keywords.category}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-6 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              搜索中...
            </div>
          )}

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div ref={resultsRef} className="max-h-64 overflow-y-auto">
              {results.map((item, index) => (
                <button
                  key={`${item.result_type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent-50 dark:bg-accent-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {item.result_type === 'note' ? (
                    item.status === 'todo'
                      ? <Circle size={16} className="text-orange-400 shrink-0" />
                      : <FileText size={16} className="text-blue-400 shrink-0" />
                  ) : (
                    <FileText size={16} className="text-purple-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.title || '(无标题)'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.content?.slice(0, 60) || item.url || item.username || ''}
                    </div>
                  </div>
                  {item.result_type === 'password_entry' && (
                    <span className="text-[10px] text-purple-500 shrink-0">密码</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 无结果 → 快速创建 */}
          {showCreateHint && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  未找到相关内容
                </span>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:text-accent-600 transition-colors"
                >
                  <ArrowUp size={14} />
                  快速创建
                </button>
              </div>
            </div>
          )}

          {/* 底部提示 */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] text-gray-400 flex items-center gap-3">
            <span>↑↓ 导航</span>
            <span>Enter 选择/创建</span>
            <span>Esc 关闭</span>
          </div>
        </div>
      </div>
    </div>
  );
}
