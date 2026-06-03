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
import { useCommandPalette } from '../App';
import {
  Trash2, Calendar, Archive, RotateCcw,
  ListTodo
} from 'lucide-react';
import { useReminderCheck } from '../hooks/useReminderCheck';

const COLUMNS = [
  { id: 'note', title: '备忘', color: 'bg-accent-500' },
  { id: 'todo', title: '待办', color: 'bg-yellow-500' },
  { id: 'in_progress', title: '进行中', color: 'bg-orange-500' },
  { id: 'done', title: '已完成', color: 'bg-green-500' },
];

// 可拖拽排序的笔记卡片
function SortableNoteCard({ note, onClick, onDelete, onTagClick, isMergeTarget = false, isChild = false, actionType = null }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({
    id: note.id,
    data: { note, type: 'note' },
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
      data-note-id={note.id}
      {...listeners}
      {...attributes}
      onClick={() => onClick(note)}
      className={`group relative p-3 bg-white dark:bg-gray-800 rounded-lg border
        transition-all cursor-grab active:cursor-grabbing ${
        isMergeTarget
          ? 'border-accent ring-2 ring-accent/30 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 hover:border-accent hover:shadow-sm'
      }`}
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

      {/* 合并为子任务的拖入框 */}
      {actionType === 'merge' && (
        <div className="absolute inset-x-0 bottom-0 h-10 z-10
          bg-accent/10 border-2 border-dashed border-accent rounded-b-lg
          flex items-center justify-center pointer-events-none">
          <span className="text-accent text-xs font-medium">↓ 置为子任务</span>
        </div>
      )}

      {/* 置为主任务提示虚线 */}
      {actionType === 'promote' && (
        <>
          <div className="absolute -top-[5px] left-2 right-2 z-10 pointer-events-none">
            <div className="border-t-2 border-dashed border-emerald-400 w-full" />
          </div>
          <div className="absolute -top-3 right-3 z-20 pointer-events-none
            bg-emerald-500 text-white text-[10px] font-medium
            px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
            置为主任务 ↑
          </div>
        </>
      )}

      {/* 跨列状态变更提示虚线 */}
      {actionType === 'change-status' && (
        <div className="absolute -top-[5px] left-2 right-2 z-10 pointer-events-none">
          <div className="border-t-2 border-dashed border-blue-400 w-full" />
        </div>
      )}
    </div>
  );
}

// 可放置的列（支持层级缩进+连线）
function KanbanColumn({ column, items, onNoteClick, onDelete, onTagClick, onCreateNote, mergeTargetId, dragAction }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const noteIds = useMemo(() => items.map(i => i.note.id), [items]);

  // 检查是否有子任务出现在这个列中（用于画连线）
  const hasSiblingAfter = (idx) => {
    return idx + 1 < items.length && items[idx + 1].depth === items[idx].depth;
  };

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
        <span className="ml-auto text-xs text-gray-400">{items.length}</span>
      </div>

      {/* 卡片列表（含层级） */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[120px] max-h-[calc(100vh-240px)] md:max-h-[calc(100vh-300px)]">
        <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <div key={item.note.id} className="relative">
              {/* 子任务层级连接线 */}
              {item.depth > 0 && (
                <div className="absolute left-[-12px] top-0 bottom-0 w-px
                  bg-gray-300 dark:bg-gray-600 hidden md:block"
                  style={{ height: hasSiblingAfter(idx) ? '100%' : '50%' }}
                />
              )}
              {item.depth > 0 && (
                <div className="absolute left-[-12px] top-[50%] w-3 h-px
                  bg-gray-300 dark:bg-gray-600 hidden md:block" />
              )}
              {item.depth > 0 && (
                <div className="absolute left-[-8px] top-[calc(50%-3px)]
                  w-0 h-0 hidden md:block
                  border-t-[4px] border-b-[4px] border-l-[6px]
                  border-transparent border-l-gray-300 dark:border-l-gray-600"
                />
              )}

              <div className={item.depth > 0 ? 'ml-6 md:ml-8' : ''}>
                <SortableNoteCard
                  note={item.note}
                  onClick={onNoteClick}
                  onDelete={onDelete}
                  onTagClick={onTagClick}
                  isMergeTarget={mergeTargetId === item.note.id}
                  isChild={item.depth > 0}
                  actionType={dragAction?.type}
                />
              </div>
            </div>
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            {isOver
              ? (dragAction ? dragAction.label : '释放以放入')
              : '拖拽笔记到此处'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardPage({ onVoiceInput }) {
  const [notes, setNotes] = useState([]);
  const { openPalette } = useCommandPalette();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeDragNote, setActiveDragNote] = useState(null);
  const [mergeTargetId, setMergeTargetId] = useState(null);
  const [dragAction, setDragAction] = useState(null); // { type:'merge'|'promote'|'change-status', label:string } | null
  const [showArchived, setShowArchived] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categories, setCategories] = useState([]);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const dragStartYRef = useRef(0);

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

  // 分组（按状态 + 排序 + 父子层级）
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

    // 按状态分组
    const byStatus = {};
    filtered.forEach((note) => {
      const key = note.status;
      if (!byStatus[key]) byStatus[key] = [];
      byStatus[key].push(note);
    });

    // 构建层级结构
    Object.keys(byStatus).forEach((key) => {
      const colNotes = byStatus[key];
      const parents = colNotes.filter(n => !n.parent_id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      const result = [];
      parents.forEach((parent) => {
        result.push({ note: parent, depth: 0 });
        const children = colNotes.filter(n => n.parent_id === parent.id)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        children.forEach((child) => {
          result.push({ note: child, depth: 1 });
        });
      });

      if (grouped[key] !== undefined) {
        grouped[key] = result;
      } else {
        grouped.archived = result;
      }
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
    setMergeTargetId(null);
    setDragAction(null);
    if (event.activatorEvent) {
      dragStartYRef.current = event.activatorEvent.clientY || 0;
    }
  }, []);

  // 检测拖拽动作类型（共用于 onDragOver 和 onDragMove）
  const detectDragAction = useCallback((active, over, deltaY) => {
    if (!over) return null;

    const overData = over.data.current;
    const activeNote = active.data.current?.note;
    if (!activeNote) return null;

    if (overData?.type === 'note') {
      const targetNote = overData.note;
      if (targetNote.id === activeNote.id) return null;

      const el = document.querySelector(`[data-note-id="${targetNote.id}"]`);
      if (!el) return null;

      const rect = el.getBoundingClientRect();
      const clientY = dragStartYRef.current + deltaY;
      const relativeY = (clientY - rect.top) / rect.height;
      const threshold = window.innerWidth < 768 ? 0.4 : 0.3;

      // 底部区域 → 合并为子任务
      if (relativeY > threshold) {
        return { type: 'merge', mergeId: targetNote.id, label: '↓ 置为子任务' };
      }

      // 顶部区域
      if (activeNote.parent_id) {
        return { type: 'promote', mergeId: null, label: '↑ 置为主任务' };
      }
      if (activeNote.status !== targetNote.status) {
        const statusLabel = STATUS_CONFIG[targetNote.status]?.label || targetNote.status;
        return { type: 'change-status', mergeId: null, label: `→ 置为${statusLabel}` };
      }
      return null;
    }

    if (overData?.type === 'column') {
      const colId = overData.columnId;
      if (activeNote.parent_id) {
        return { type: 'promote', mergeId: null, label: '↑ 置为主任务' };
      }
      if (activeNote.status !== colId) {
        const statusLabel = STATUS_CONFIG[colId]?.label || colId;
        return { type: 'change-status', mergeId: null, label: `→ 置为${statusLabel}` };
      }
      return null;
    }

    return null;
  }, []);

  // 拖拽移动中 - 连续检测（onDragMove 每次指针移动都触发）
  const handleDragMove = useCallback((event) => {
    const { active, over, delta } = event;
    const action = detectDragAction(active, over, delta?.y || 0);
    if (action) {
      setMergeTargetId(action.mergeId);
      setDragAction({ type: action.type, label: action.label });
    } else {
      setMergeTargetId(null);
      setDragAction(null);
    }
  }, [detectDragAction]);

  // 拖拽中 - over 变化时检测
  const handleDragOver = useCallback((event) => {
    handleDragMove(event);
  }, [handleDragMove]);

  // 拖拽结束 - 处理排序/合并/状态变更
  const handleDragEnd = useCallback(async (event) => {
    setActiveDragNote(null);
    setMergeTargetId(null);
    setDragAction(null);

    const { active, over } = event;
    if (!over) return;

    const note = active.data.current?.note;
    if (!note) return;

    // 情况1: 合并为子任务（底部区域检测）
    if (mergeTargetId && mergeTargetId !== note.id) {
      const targetId = mergeTargetId;
      const targetNote = notes.find(n => n.id === targetId);
      const newStatus = targetNote?.status || note.status;
      const oldStatus = note.status;
      const oldParentId = note.parent_id;
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === note.id) {
            return { ...n, parent_id: targetId, status: newStatus };
          }
          // 被拖拽的笔记如果是父任务 → 提升其子任务（避免消失）
          if (n.parent_id === note.id) {
            return { ...n, parent_id: null };
          }
          return n;
        })
      );
      try {
        await api.notes.update(note.id, { parent_id: targetId, status: newStatus });
      } catch {
        setNotes((prev) =>
          prev.map((n) => {
            if (n.id === note.id) return { ...n, parent_id: oldParentId, status: oldStatus };
            if (n.parent_id === null && oldParentId !== null && prev.find(p => p.id === note.id)?.parent_id === targetId) {
              return { ...n, parent_id: note.id };
            }
            return n;
          })
        );
      }
      return;
    }

    const overType = over.data.current?.type;

    // 情况2: 放到列上（改变状态并放到列末尾）
    if (overType === 'column') {
      const newStatus = over.data.current.columnId;
      const oldStatus = note.status;
      const maxPos = notes
        .filter(n => n.status === newStatus)
        .reduce((max, n) => Math.max(max, n.position || 0), 0);

      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === note.id) {
            return { ...n, status: newStatus, parent_id: null, position: maxPos + 1000 };
          }
          // 父任务移走 → 子任务提升为主任务（避免消失）
          if (n.parent_id === note.id) {
            return { ...n, parent_id: null };
          }
          return n;
        })
      );
      try {
        await api.notes.update(note.id, { status: newStatus, parent_id: null, position: maxPos + 1000 });
      } catch {
        setNotes((prev) =>
          prev.map((n) => {
            if (n.id === note.id) return { ...n, status: oldStatus, parent_id: note.parent_id, position: note.position };
            // 回滚子任务提升
            if (n.parent_id === null && prev.find(p => p.id === note.id)?.parent_id === note.id) {
              return { ...n, parent_id: note.id };
            }
            return n;
          })
        );
      }
      return;
    }

    // 情况3: 放到另一张卡片上
    if (overType === 'note') {
      const targetNote = over.data.current.note;
      if (!targetNote || targetNote.id === note.id) return;

      if (note.status === targetNote.status) {
        // 同列重排序

        // 子任务拖到目标卡片顶部 → 先提升为主任务
        if (note.parent_id) {
          const oldParentId = note.parent_id;
          setNotes((prev) =>
            prev.map((n) => (n.id === note.id ? { ...n, parent_id: null } : n))
          );
          try {
            await api.notes.update(note.id, { parent_id: null });
          } catch {
            setNotes((prev) =>
              prev.map((n) => (n.id === note.id ? { ...n, parent_id: oldParentId } : n))
            );
            return;
          }
        }

        // 构建层级列表 → 移动拖拽项到目标位置 → 重新分配 position
        const updates = []; // { id, position }[]
        setNotes((prev) => {
          const colNotes = prev.filter(n => n.status === note.status);

          // 构建扁平的层级列表（与 groupedColumns 逻辑一致）
          const parents = colNotes.filter(n => !n.parent_id)
            .sort((a, b) => (a.position || 0) - (b.position || 0));
          const items = [];
          parents.forEach((p) => {
            items.push(p.id);
            colNotes.filter(n => n.parent_id === p.id)
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .forEach(c => items.push(c.id));
          });

          const fromIdx = items.indexOf(note.id);
          const toIdx = items.indexOf(targetNote.id);
          if (fromIdx === -1 || toIdx === -1) return prev;

          // 拖动项从原位移除，插入到目标位置
          const newItems = [...items];
          const [movedId] = newItems.splice(fromIdx, 1);
          newItems.splice(fromIdx < toIdx ? toIdx : toIdx, 0, movedId);

          // 给所有项分配新 position
          const posMap = {};
          newItems.forEach((id, idx) => { posMap[id] = idx * 1000; });

          // 记录 API 需要更新的项
          newItems.forEach((id, idx) => {
            const oldNote = colNotes.find(n => n.id === id);
            if (oldNote && (oldNote.position || 0) !== idx * 1000) {
              updates.push({ id, position: idx * 1000 });
            }
          });

          return prev.map(n =>
            posMap[n.id] !== undefined ? { ...n, position: posMap[n.id] } : n
          );
        });

        // API: 批量更新 position（只更新拖动的卡片）
        try {
          await api.notes.update(note.id, { position: targetNote.position || 0 });
          await api.notes.update(targetNote.id, { position: note.position || 0 });
        } catch {}
      } else {
        // 不同列：移动到目标卡片所在列 + 子任务提升
        const oldStatus = note.status;
        const oldParentId = note.parent_id;
        const oldPosition = note.position;
        const targetPos = targetNote.position || 0;
        setNotes((prev) =>
          prev.map((n) => {
            if (n.id === note.id) {
              return { ...n, status: targetNote.status, parent_id: null, position: targetPos + 1 };
            }
            // 父任务移走 → 子任务提升为主任务
            if (n.parent_id === note.id) {
              return { ...n, parent_id: null };
            }
            return n;
          })
        );
        try {
          await api.notes.update(note.id, { status: targetNote.status, parent_id: null, position: targetPos + 1 });
        } catch {
          setNotes((prev) =>
            prev.map((n) => {
              if (n.id === note.id) return { ...n, status: oldStatus, parent_id: oldParentId, position: oldPosition };
              // 回滚子任务提升
              if (n.parent_id === null && prev.find(p => p.id === note.id)?.parent_id === note.id) {
                return { ...n, parent_id: note.id };
              }
              return n;
            })
          );
        }
      }
      return;
    }
  }, [mergeTargetId, notes]);

  // 创建/编辑/删除
  const handleCreateNote = useCallback(() => {
    setEditingNote(null);
    setIsCreating(true);
  }, []);

  // 全局快速创建笔记（来自 Toolbar 输入栏）
  const handleQuickCreate = useCallback(async (noteData) => {
    try {
      const created = await api.notes.create(noteData);
      setNotes((prev) => [created.data.note, ...prev]);
    } catch (err) {
      console.error('Quick create error:', err);
    }
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
    fetchNotes(false); // 刷新获取SubtaskList新增的子任务
  }, [fetchNotes]);

  const handleTagClick = useCallback((tag) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }, []);

  const handleClearTag = useCallback(() => {
    setActiveTag(null);
  }, []);

  const handleCategoryClick = useCallback((catName) => {
    setActiveCategory((prev) => prev === catName ? null : catName);
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
        onOpenPalette={openPalette}
        onQuickCreate={handleQuickCreate}
        onVoiceInput={onVoiceInput}
        categories={categories}
        activeCategory={activeCategory}
        showCategoryPills={true}
        categoryPills={categories}
        onCategoryClick={handleCategoryClick}
      />

      <main className="px-4 py-4">
        {/* 操作栏 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">看板</h2>
          <div className="flex-1" />

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
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
          >
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  items={groupedColumns[col.id] || []}
                  onNoteClick={handleNoteClick}
                  onDelete={handleDelete}
                  onTagClick={handleTagClick}
                  onCreateNote={handleCreateNote}
                  mergeTargetId={mergeTargetId}
                  dragAction={dragAction}
                />
              ))}

              {/* 归档列 */}
              {showArchived && (
                <KanbanColumn
                  column={{ id: 'archived', title: '已归档', color: 'bg-gray-400' }}
                  items={groupedColumns.archived || []}
                  onNoteClick={handleNoteClick}
                  onDelete={handleDelete}
                  onTagClick={handleTagClick}
                  onCreateNote={handleCreateNote}
                  mergeTargetId={mergeTargetId}
                  dragAction={dragAction}
                />
              )}
            </div>

            <DragOverlay>
              {activeDragNote ? (
                <div className="relative p-3 bg-white dark:bg-gray-800 rounded-lg border border-accent shadow-lg opacity-90 rotate-2">
                  {dragAction && (
                    <div className={`absolute -top-3 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-medium shadow-lg whitespace-nowrap ${
                      dragAction.type === 'merge'
                        ? 'bg-accent text-white'
                        : dragAction.type === 'promote'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {dragAction.label}
                    </div>
                  )}
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
