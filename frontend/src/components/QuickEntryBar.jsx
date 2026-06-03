import React, { useState, useRef, useCallback } from 'react';
import { Mic, ArrowUp, FileText, Circle, Loader2 } from 'lucide-react';
import { matchKeywords } from '../utils/keywordMatcher';

export default function QuickEntryBar({ onCreateNote, onVoiceInput, categories = [] }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('note');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);
  const isComposing = useRef(false);
  const creatingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || creatingRef.current) return;

    creatingRef.current = true;
    setCreating(true);
    try {
      await onCreateNote({
        content: trimmed,
        status,
        title: trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed,
      });

      setText('');
      inputRef.current?.focus();
    } catch {
      // 错误由上层处理
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }, [text, status, onCreateNote]);

  const handleKeyDown = useCallback((e) => {
    if (isComposing.current) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleCompositionStart = () => { isComposing.current = true; };
  const handleCompositionEnd = () => { isComposing.current = false; };

  const hasText = text.trim().length > 0;

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
      border-t border-gray-200/70 dark:border-gray-800/70 safe-area-bottom
      shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.2)]">
      <div className="flex items-end gap-2 px-3 py-2.5">
        {/* Status toggle */}
        <button
          onClick={() => setStatus(s => s === 'note' ? 'todo' : 'note')}
          disabled={creating}
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            status === 'todo'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          } ${creating ? 'opacity-50' : ''}`}
          title={status === 'note' ? '切换为待办' : '切换为备忘'}
        >
          {status === 'todo' ? <Circle size={16} /> : <FileText size={16} />}
        </button>

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
            placeholder={creating ? '创建中...' : status === 'note' ? '写点什么...' : '添加待办...'}
            className="w-full px-4 py-2.5 pr-10 bg-gray-100 dark:bg-gray-800
              rounded-xl text-sm text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              border border-transparent focus:border-accent/30
              focus:ring-1 focus:ring-accent/20 focus:bg-gray-50 dark:focus:bg-gray-800/80
              outline-none transition-all
              disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {/* Clear button (when has text) */}
          {hasText && !creating && (
            <button
              onClick={() => setText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1
                rounded-full text-gray-400 hover:text-gray-600
                dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700
                transition-colors text-xs leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {/* Voice / Send / Loading */}
        {creating ? (
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent/70 text-white
            flex items-center justify-center">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : hasText ? (
          <button
            onClick={handleSubmit}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent text-white
              flex items-center justify-center active:scale-90 transition-transform
              shadow-sm shadow-accent/30"
            aria-label="发送"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={onVoiceInput}
            className="flex-shrink-0 w-9 h-9 rounded-xl
              bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400
              hover:bg-gray-200 dark:hover:bg-gray-700
              flex items-center justify-center active:scale-90 transition-all"
            aria-label="语音输入"
          >
            <Mic size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
