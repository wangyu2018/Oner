import React, { useState, useCallback, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { usePluginManagerContext } from '../App';

export default function FloatingAIToolbar({ editorRef, onAction }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef(null);
  const { isPluginActive } = usePluginManagerContext();
  const aiEnabled = isPluginActive?.('oner.plugin.ai') ?? true;

  const updatePosition = useCallback(() => {
    const el = editorRef?.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !el.contains(sel.anchorNode)) {
      setVisible(false);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = el.getBoundingClientRect();

    setPosition({
      top: rect.top - editorRect.top - 48,
      left: rect.left - editorRect.left + (rect.width / 2),
    });
    setVisible(true);
  }, [editorRef]);

  const handleAction = (action) => {
    onAction?.(action);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-[10px]
        bg-gray-900 dark:bg-gray-800 shadow-lg border border-gray-700/50
        animate-in fade-in zoom-in-95"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      {/* 箭头 */}
      <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2
        w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px]
        border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-800"
      />

      <button
        onClick={() => handleAction('bold')}
        className="w-7 h-7 flex items-center justify-center rounded-md
          text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-bold"
      >
        B
      </button>
      <button
        onClick={() => handleAction('italic')}
        className="w-7 h-7 flex items-center justify-center rounded-md
          text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm italic"
      >
        I
      </button>
      <button
        onClick={() => handleAction('link')}
        className="w-7 h-7 flex items-center justify-center rounded-md
          text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm"
      >
        🔗
      </button>

      <div className="w-px h-5 bg-gray-700 mx-0.5" />

      {aiEnabled && (<>
      <button
        onClick={() => handleAction('ai-continue')}
        className="inline-flex items-center gap-1 px-2 h-7 rounded-md
          text-violet-400 hover:bg-violet-500/15 hover:text-violet-400 transition-all text-xs font-medium"
      >
        <Sparkles size={12} />
        AI续写
      </button>
      <button
        onClick={() => handleAction('ai-rewrite')}
        className="inline-flex items-center gap-1 px-2 h-7 rounded-md
          text-violet-400 hover:bg-violet-500/15 hover:text-violet-400 transition-all text-xs font-medium"
      >
        <Sparkles size={12} />
        改写
      </button>
      <button
        onClick={() => handleAction('ai-translate')}
        className="inline-flex items-center gap-1 px-2 h-7 rounded-md
          text-violet-400 hover:bg-violet-500/15 hover:text-violet-400 transition-all text-xs font-medium"
      >
        🌐
        翻译
      </button>
      <button
        onClick={() => handleAction('ai-summarize')}
        className="inline-flex items-center gap-1 px-2 h-7 rounded-md
          text-violet-400 hover:bg-violet-500/15 hover:text-violet-400 transition-all text-xs font-medium"
      >
        📋
        总结
      </button>
      </>)}
    </div>
  );
}
