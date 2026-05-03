import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Eye } from 'lucide-react';
import TagChip from './TagChip';
import MarkdownRenderer from './MarkdownRenderer';
import StatusSelector from './StatusSelector';
import { PrioritySelector } from './PriorityBadge';
import DueDatePicker from './DueDatePicker';
import { parseTags } from '../utils/tags';
import { useAutoSave } from '../hooks/useAutoSave';

export default function NoteEditor({ note, onSave, onClose }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState(note?.tags || []);
  const [status, setStatus] = useState(note?.status || 'note');
  const [priority, setPriority] = useState(note?.priority || 'normal');
  const [dueDate, setDueDate] = useState(note?.due_date || null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const noteId = note?.id || 'new';
  const draftData = { title, content, tags, status, priority, dueDate };

  const { clearDraft, getDraft } = useAutoSave(noteId, draftData);

  // Load draft on mount for new notes
  useEffect(() => {
    if (!note?.id) {
      const draft = getDraft();
      if (draft) {
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setTags(draft.tags || []);
        setStatus(draft.status || 'note');
        setPriority(draft.priority || 'normal');
        setDueDate(draft.dueDate || null);
      }
    }
  }, []);

  // Parse tags when content changes
  useEffect(() => {
    const parsed = parseTags(content);
    setTags(parsed);
  }, [content]);

  const handleSave = useCallback(async () => {
    if (!content.trim() && !title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        tags,
        status,
        priority,
        due_date: dueDate || null
      });
      clearDraft();
      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }, [title, content, tags, status, priority, dueDate, onSave, clearDraft, onClose]);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSave, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl
          shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题（可选）"
            className="text-lg font-medium bg-transparent outline-none flex-1
              text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded-lg transition-colors ${
                showPreview
                  ? 'bg-accent text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              }`}
            >
              <Eye size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 工具栏：状态、优先级、截止日期 */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">状态：</span>
            <StatusSelector value={status} onChange={setStatus} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">优先级：</span>
            <PrioritySelector value={priority} onChange={setPriority} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">截止：</span>
            <DueDatePicker value={dueDate} onChange={setDueDate} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showPreview ? (
            <div className="markdown-content">
              <MarkdownRenderer content={content} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始写作... 支持 Markdown 语法&#10;&#10;使用 #标签 来添加标签"
              className="w-full h-full min-h-[300px] bg-transparent outline-none resize-none
                text-gray-900 dark:text-gray-100 placeholder-gray-400 leading-relaxed"
              autoFocus
            />
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagChip key={tag} tag={tag} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-400">
            {saving ? '保存中...' : '按 Cmd+S 保存，Esc 关闭'}
          </span>
          <button
            onClick={handleSave}
            disabled={saving || (!content.trim() && !title.trim())}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white
              rounded-lg hover:bg-accent-600 transition-colors font-medium disabled:opacity-50"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
