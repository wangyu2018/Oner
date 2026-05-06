import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DndContext, DragOverlay, closestCorners,
  useDroppable, useSensor, useSensors, PointerSensor
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../utils/api';
import Toolbar from '../components/Toolbar';
import NoteEditor from '../components/NoteEditor';
import EmptyState from '../components/EmptyState';
import ReminderOverlay from '../components/ReminderOverlay';
import TagChip from '../components/TagChip';
import PriorityBadge from '../components/PriorityBadge';
import { RecurrenceBadge } from '../components/RecurrenceSelector';
import { CategoryBadge } from '../components/CategorySelector';
import CategoryManager from '../components/CategoryManager';
import { STATUS_CONFIG } from '../components/StatusSelector';
import { getContentPreview, extractFirstLine } from '../utils/tags';
import {
  Trash2, Calendar, Archive, RotateCcw,
  Plus, Tag, Settings2, ListTodo
} from 'lucide-react';
import { useReminderCheck } from '../hooks/useReminderCheck';

const COLUMNS = [
  { id: 'note', title: '备忘', color: 'bg-accent-500' },
  { id: 'todo', title: '待办', color: 'bg-yellow-500' },
  { id: 'in_progress', title: '进行中', color: 'bg-orange-500' },
  { id: 'done', title: '已完成', color: 'bg-green-500' },
];

// 可拖拽排序的笔记卡片（含合并放置区）
function SortableNoteCard({ note, onClick, onDelete, onTagClick }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({
    id: note.id,
    data: { note, type: 'note' },
  });

  // 合并子任务的放置区
  const { setNodeRef: setMergeRef, isOver: isMergeOver } = useDroppable({
    id: `merge-${note.id}`,
    data: { type: 'merge', targetId: note.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: 'none',
  };

  const title = note.title || extractFirstLine(note.content) || '无标题';
  const preview = getContentPreview(note.content, 80);
  const date = new Date(note.updated_at).toLocaleDateString('zh-CN', {
    month: 'short', day: 'numeric',
  });

  const statusConfig = STATUS_CONFIG[note.status] || STATUS_CONFIG.note;
  const StatusIcon = statusConfig.icon;

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(note);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(note)}
      className="group relative p-3 bg-white dark:bg-gray-800 rounded-lg border
        border-gray-200 dark:border-gray-700 hover:border-accent
        hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
    >
      {/* 删除按钮 */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 rounded-md opacity-0
          group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30
          text-gray-400 hover:text-red-500 transition-all z-10"
      >
        <Trash2 size={12} />
      </button>

      {/* 状态/优先级/分类/子任务指示 */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${statusConfig.bgColor} ${statusConfig.textColor}`}>
          <StatusIcon size={9} />
          {statusConfig.label}
        </span>
        {note.priority !== 'normal' && (
          <PriorityBadge priority={note.priority} size="xs" showLabel={false} />
        )}
        <RecurrenceBadge recurrence={note.recurrence} size="xs" />
        <CategoryBadge category={note.category} size="xs" />
        {note.parent_id && (
          <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <ListTodo size={9} />
            子任务
          </span>
        )}
      </div>

      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 pr-6">
        {title}
      </h4>

      {preview && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {preview}
        </p>
      )}

      {/* 截止日期 */}
      {note.due_date && (
        <div className="flex items-center gap-1 text-[10px] mb-1.5 text-gray-500 dark:text-gray-400">
          <Calendar size={10} />
          <span>{new Date(note.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
        </div>
      )}

      {/* 子任务进度 (作为父任务时) */}
      {note.subtask_total > 0 && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${(note.subtask_done / note.subtask_total) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{note.subtask_done}/{note.subtask_total}</span>
        </div>
      )}

      {/* 标签和日期 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 2).map((tag) => (
            <TagChip key={tag} tag={tag} size="xs" onClick={(e) => { e.stopPropagation(); onTagClick(tag); }} />
          ))}
          {note.tags?.length > 2 && (
            <span className="text-[10px] text-gray-400">+{note.tags.length - 2}</span>
          )}
        </div>
        <span className="text-[10px] text-gray-400">{date}</span>
      </div>

      {/* 合并放置区 */}
      <div
        ref={setMergeRef}
        className={`mt-2 rounded-md border-2 border-dashed text-[10px] text-center py-1
          transition-colors ${isMergeOver
            ? 'border-accent bg-accent/10 text-accent font-medium'
            : 'border-transparent text-gray-300 dark:text-gray-600 group-hover:border-gray-300 dark:group-hover:border-gray-600 group-hover:text-gray-400'
          }`}
      >
        {isMergeOver ? '释放以合并为子任务' : '拖拽到此处合并'}
      </div>
    </div>
  );
}

// 可放置的列
function KanbanColumn({ column, notes, onNoteClick, onDelete, onTagClick, onCreateNote }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const noteIds = useMemo(() => notes.map(n => n.id), [notes]);

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-colors ${
        isOver
          ? 'border-accent bg-accent/5 dark:bg-accent/10'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50'
      }`}
    >
      {/* 列头 */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">{column.title}</h3>
        <span className="ml-auto text-xs text-gray-400">{notes.length}</span>
      </div>

      {/* 卡片列表（含排序） */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[120px] max-h-[calc(100vh-220px)]">
        <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
          {notes.map((note) => (
            <SortableNoteCard
              key={note.id}
              note={note}
              onClick={onNoteClick}
              onDelete={onDelete}
              onTagClick={onTagClick}
            />
          ))}
        </SortableContext>
        {notes.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            {isOver ? '释放以放入' : '拖拽笔记到此处'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeDragNote, setActiveDragNote] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categories, setCategories] = useState([]);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const { reminders, showOverlay, dismissOverlay } = useReminderCheck();

  // 拖拽传感器 - 5px 距离阈值区分点击和拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      const data = await api.categories.list();
      setCategories(data.data.categories || []);
    } catch {}
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // 分组（按状态 + 排序）
  const groupedColumns = useMemo(() => {
    const grouped = {};
    COLUMNS.forEach((col) => { grouped[col.id] = []; });
    grouped.archived = [];

    let filtered = notes;
    if (activeTag) {
      filtered = filtered.filter((n) => n.tags?.includes(activeTag));
    }
    if (activeCategory) {
      filtered = filtered.filter((n) => n.category === activeCategory);
    }
    if (!showArchived) {
      filtered = filtered.filter((n) => n.status !== 'archived');
    }

    filtered.forEach((note) => {
      if (grouped[note.status] !== undefined) {
        grouped[note.status].push(note);
      } else {
        grouped.archived.push(note);
      }
    });

    // 按 position 排序
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => (a.position || 0) - (b.position || 0));
    });

    return grouped;
  }, [notes, activeTag, activeCategory, showArchived]);

  // 获取笔记
  const fetchNotes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await api.notes.list({ include_subtasks: true });
      if (isMountedRef.current) {
        setNotes(data.data.notes);
        setLastSync(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) setError(err.message);
    } finally {
      if (isMountedRef.current && showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchNotes(true);
    intervalRef.current = setInterval(() => fetchNotes(false), 30000);
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotes]);

  // 拖拽开始
  const handleDragStart = useCallback((event) => {
    const note = event.active.data.current?.note;
    setActiveDragNote(note || null);
  }, []);

  // 拖拽结束 - 处理排序/合并/状态变更
  const handleDragEnd = useCallback(async (event) => {
    setActiveDragNote(null);
    const { active, over } = event;
    if (!over) return;

    const note = active.data.current?.note;
    if (!note) return;

    const overType = over.data.current?.type;

    // 情况1: 合并为子任务
    if (overType === 'merge') {
      const targetId = over.data.current.targetId;
      if (targetId === note.id) return; // 不能合并到自己
      // 乐观更新：从当前列移除
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, parent_id: targetId } : n))
      );
      try {
        await api.notes.update(note.id, { parent_id: targetId });
      } catch {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, parent_id: note.parent_id } : n))
        );
      }
      return;
    }

    // 情况2: 放到列上（提升或改变状态）
    if (overType === 'column') {
      const newStatus = over.data.current.columnId;
      const oldStatus = note.status;
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, status: newStatus, parent_id: null } : n))
      );
      try {
        await api.notes.update(note.id, { status: newStatus, parent_id: null });
      } catch {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, status: oldStatus, parent_id: note.parent_id } : n))
        );
      }
      return;
    }

    // 情况3: 放到另一张卡片上或同列排序
    if (overType === 'note') {
      const targetNote = over.data.current.note;
      if (!targetNote || targetNote.id === note.id) return;

      if (note.status === targetNote.status) {
        // 同列：交换 position 实现排序
        const notePos = note.position || 0;
        const targetPos = targetNote.position || 0;
        setNotes((prev) =>
          prev.map((n) => {
            if (n.id === note.id) return { ...n, position: targetPos };
            if (n.id === targetNote.id) return { ...n, position: notePos };
            return n;
          })
        );
        try {
          await api.notes.update(note.id, { position: targetPos });
          await api.notes.update(targetNote.id, { position: notePos });
        } catch {
          // 失败回退
          setNotes((prev) =>
            prev.map((n) => {
              if (n.id === note.id) return { ...n, position: notePos };
              if (n.id === targetNote.id) return { ...n, position: targetPos };
              return n;
            })
          );
        }
      } else {
        // 不同列：移动到目标卡片所在列 + 提升
        const oldStatus = note.status;
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, status: targetNote.status, parent_id: null } : n))
        );
        try {
          await api.notes.update(note.id, { status: targetNote.status, parent_id: null });
        } catch {
          setNotes((prev) =>
            prev.map((n) => (n.id === note.id ? { ...n, status: oldStatus, parent_id: note.parent_id } : n))
          );
        }
      }
      return;
    }
  }, []);

  // 创建/编辑/删除
  const handleCreateNote = useCallback(() => {
    setEditingNote(null);
    setIsCreating(true);
  }, []);

  const handleNoteClick = useCallback((note) => {
    setEditingNote(note);
    setIsCreating(false);
  }, []);

  const handleSave = useCallback(async (data) => {
    if (editingNote) {
      const updated = await api.notes.update(editingNote.id, data);
      setNotes((prev) =>
        prev.map((n) => (n.id === editingNote.id ? updated.data.note : n))
      );
    } else {
      const created = await api.notes.create(data);
      setNotes((prev) => [created.data.note, ...prev]);
    }
  }, [editingNote]);

  const handleDelete = useCallback(async (note) => {
    try {
      await api.notes.delete(note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditingNote(null);
    setIsCreating(false);
  }, []);

  const handleTagClick = useCallback((tag) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }, []);

  const handleClearTag = useCallback(() => {
    setActiveTag(null);
  }, []);

  const handleCategoryClick = useCallback((catName) => {
    setActiveCategory((prev) => (prev === catName ? null : catName));
  }, []);

  // 从提醒浮层打开笔记
  const handleReminderNoteClick = useCallback((item) => {
    const note = notes.find((n) => n.id === item.id);
    if (note) {
      setEditingNote(note);
      setIsCreating(false);
    }
  }, [notes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => fetchNotes(true)} className="px-4 py-2 bg-accent text-white rounded-lg">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toolbar
        onCreateNote={handleCreateNote}
        activeTag={activeTag}
        onClearTag={handleClearTag}
        lastSync={lastSync}
        onRefresh={() => fetchNotes(true)}
        loading={loading}
      />

      <main className="px-4 py-4">
        {/* 操作栏 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">看板</h2>
          <div className="flex-1" />

          {/* 分类筛选 */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.name
                  ? 'ring-2 ring-offset-1 dark:ring-offset-gray-950 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}
            >
              <Tag size={10} />
              {cat.name}
              {activeCategory === cat.name && (
                <span className="ml-0.5 opacity-70" onClick={(e) => { e.stopPropagation(); setActiveCategory(null); }}>×</span>
              )}
            </button>
          ))}

          {/* 分类管理按钮 */}
          <button
            onClick={() => setShowCategoryManager(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="管理分类"
          >
            <Settings2 size={12} />
            分类
          </button>

          {activeTag && (
            <button
              onClick={handleClearTag}
              className="text-xs px-2 py-1 rounded-full bg-accent-100 dark:bg-accent-900/50
                text-accent-800 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-900"
            >
              #{activeTag} ×
            </button>
          )}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showArchived
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {showArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
            {showArchived ? '隐藏归档' : '显示归档'}
          </button>
        </div>

        {/* 看板 */}
        {notes.length === 0 && !activeTag && !activeCategory ? (
          <EmptyState onCreateNote={handleCreateNote} />
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
          >
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  notes={groupedColumns[col.id] || []}
                  onNoteClick={handleNoteClick}
                  onDelete={handleDelete}
                  onTagClick={handleTagClick}
                  onCreateNote={handleCreateNote}
                />
              ))}

              {/* 归档列 */}
              {showArchived && (
                <KanbanColumn
                  column={{ id: 'archived', title: '已归档', color: 'bg-gray-400' }}
                  notes={groupedColumns.archived || []}
                  onNoteClick={handleNoteClick}
                  onDelete={handleDelete}
                  onTagClick={handleTagClick}
                  onCreateNote={handleCreateNote}
                />
              )}
            </div>

            <DragOverlay>
              {activeDragNote ? (
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-accent shadow-lg opacity-90 rotate-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activeDragNote.title || extractFirstLine(activeDragNote.content) || '无标题'}
                  </h4>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {(isCreating || editingNote) && (
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onClose={handleCloseEditor}
        />
      )}

      {showOverlay && (
        <ReminderOverlay
          reminders={reminders}
          onClose={dismissOverlay}
          onNoteClick={handleReminderNoteClick}
        />
      )}

      {/* 分类管理弹窗 */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => { setShowCategoryManager(false); loadCategories(); }}
        onCategoryChange={loadCategories}
      />
    </div>
  );
}
