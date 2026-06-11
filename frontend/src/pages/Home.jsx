import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Columns, FileText, Circle, Loader, CheckCircle, Archive, GripVertical } from 'lucide-react';
import CommandBar from '../components/CommandBar';
import TodayFocus from '../components/TodayFocus';
import EmptyState from '../components/EmptyState';
import CardWall from '../components/CardWall';
import SwimlaneBoard from '../components/SwimlaneBoard';
import SmartCardGrid from '../components/SmartCardGrid';
import NoteEditor from '../components/NoteEditor';
import UndoToast from '../components/UndoToast';
import ReminderOverlay from '../components/ReminderOverlay';
import SwipeStatusTabs from '../components/SwipeStatusTabs';
import { useNotes } from '../hooks/useNotes';
import { useUndoDelete } from '../hooks/useUndoDelete';
import { useReminderCheck } from '../hooks/useReminderCheck';
import { useAuthContext, useCommandPalette } from '../App';
import { api } from '../utils/api';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 状态筛选 -> CSS active class
function getStatusActiveClass(buttonValue, activeStatus) {
  if (buttonValue !== activeStatus) return '';
  const map = { '': 'active-all', note: 'active-memo', todo: 'active-todo', in_progress: 'active-progress', done: 'active-done', archived: 'active-archived' };
  return map[buttonValue] || 'active-all';
}

// 可拖拽分类项
function SortableCategoryItem({ cat, active, onClick, count }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.name });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <button type="button"
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`category-item ${active ? 'active' : ''}`}
      {...attributes}
    >
      <span className="cat-name">
        <span className="cat-icon" style={{ background: cat.color ? `${cat.color}22` : undefined, color: cat.color || undefined }}>
          {cat.icon || '📌'}
        </span>
        {cat.name}
      </span>
      <span className="cat-count">{count}</span>
      <span className="category-drag-handle" {...listeners}>
        <GripVertical size={12} />
      </span>
    </button>
  );
}

export default function Home({ categories = [], onVoiceInput, mode = 'default' }) {
  const {
    notes,
    allNotes,
    loading,
    error,
    activeTag,
    setActiveTag,
    activeStatus,
    setActiveStatus,
    activeCategory,
    setActiveCategory,
    lastSync,
    refresh,
    createNote,
    updateNote,
    removeNoteFromState,
    addNoteToState
  } = useNotes();

  const { user } = useAuthContext();
  const { setCategories } = useCommandPalette();
  const navigate = useNavigate();

  // 计算活跃笔记（排除已归档和已完成），用于侧边栏和统计计数
  const activeCountNotes = React.useMemo(() =>
    allNotes.filter(n => n.status !== 'archived' && n.status !== 'done'),
  [allNotes]);

  // 按选中分类过滤活跃笔记（用于状态栏计数）
  const categoryActiveNotes = React.useMemo(() => {
    if (!activeCategory) return activeCountNotes;
    if (activeCategory === '__uncategorized__') {
      return activeCountNotes.filter(n => !n.category);
    }
    return activeCountNotes.filter(n => n.category === activeCategory);
  }, [activeCountNotes, activeCategory]);

  // 按选中分类过滤全部笔记（包含已完成/已归档，用于完成/归档计数）
  const categoryAllNotes = React.useMemo(() => {
    if (!activeCategory) return allNotes;
    if (activeCategory === '__uncategorized__') {
      return allNotes.filter(n => !n.category);
    }
    return allNotes.filter(n => n.category === activeCategory);
  }, [allNotes, activeCategory]);

  const [editingNote, setEditingNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState('wall');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [homeLayout, setHomeLayout] = useState('combined');
  const [notesReady, setNotesReady] = useState(false);

  // 加载首页布局设置
  useEffect(() => {
    api.settings.get().then(res => {
      const s = res.data || {};
      setHomeLayout(s.homeLayout || 'combined');
    }).catch(() => {});
  }, []);

  // 合并模式: notes区域延迟显示（动效）
  useEffect(() => {
    if (homeLayout === 'combined' && !loading) {
      const t = setTimeout(() => setNotesReady(true), 250);
      return () => clearTimeout(t);
    } else {
      setNotesReady(true);
    }
  }, [homeLayout, loading]);

  // 分类拖拽排序
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex(c => c.name === active.id);
    const newIndex = categories.findIndex(c => c.name === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    // 更新后端 position
    try {
      await Promise.all(reordered.map((cat, i) =>
        api.categories.update(cat.id, { position: i })
      ));
    } catch (err) {
      console.error('Failed to save category order:', err);
      // 失败时从 API 重新加载
      const res = await api.categories.list();
      if (res?.data?.categories) setCategories(res.data.categories);
    }
  }, [categories, setCategories]);

  const handleDeleteSuccess = useCallback(() => {
    // Refresh notes after confirmed delete
  }, []);

  const { pendingDelete, countdown, startDelete, undoDelete } = useUndoDelete(handleDeleteSuccess);

  const { reminders, showOverlay, dismissOverlay } = useReminderCheck();

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
      await updateNote(editingNote.id, data);
    } else {
      await createNote(data);
    }
  }, [editingNote, createNote, updateNote]);

  const handleCloseEditor = useCallback(() => {
    setEditingNote(null);
    setIsCreating(false);
  }, []);

  const handleDelete = useCallback((note) => {
    removeNoteFromState(note.id);
    startDelete(note);
  }, [removeNoteFromState, startDelete]);

  const handleUndo = useCallback(() => {
    if (pendingDelete) {
      addNoteToState(pendingDelete);
      undoDelete();
    }
  }, [pendingDelete, addNoteToState, undoDelete]);

  const handleTagClick = useCallback((tag) => {
    setActiveTag(tag);
  }, [setActiveTag]);

  const handleClearTag = useCallback(() => {
    setActiveTag(null);
  }, [setActiveTag]);

  const handleStatusChange = useCallback((status) => {
    setActiveStatus(status);
  }, [setActiveStatus]);

  // 创建新分类
  const handleCreateCategory = useCallback(async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await api.categories.create({ name });
      setNewCategoryName('');
      setAddingCategory(false);
      // 重新加载分类数据
      const res = await api.categories.list();
      if (res?.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  }, [newCategoryName, setCategories]);

  // 全局快速创建笔记（来自 Toolbar 输入栏）
  const handleQuickCreate = useCallback(async (noteData) => {
    try {
      await createNote(noteData);
    } catch (err) {
      console.error('Quick create error:', err);
    }
  }, [createNote]);

  // 从提醒浮层打开笔记
  const handleReminderNoteClick = useCallback((item) => {
    const note = allNotes.find((n) => n.id === item.id);
    if (note) {
      setEditingNote(note);
      setIsCreating(false);
    }
  }, [allNotes]);

  // 泳道视图拖拽移动笔记
  const handleMoveNote = useCallback(async (noteId, { category, status }) => {
    try {
      await updateNote(noteId, { category, status });
    } catch (err) {
      console.error('Move note error:', err);
    }
  }, [updateNote]);

  // 待办圆圈点击切换完成状态
  const handleToggleStatus = useCallback(async (noteId, newStatus) => {
    try {
      await api.notes.update(noteId, { status: newStatus });
      // 乐观更新本地状态
      await refresh();
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  }, [refresh]);

  // 状态筛选选项
  const activeFilters = [
    { value: '', label: '全部', emoji: '📋' },
    { value: 'note', label: '备忘', emoji: '📝' },
    { value: 'todo', label: '待办', emoji: '⏰' },
    { value: 'in_progress', label: '进行中', emoji: '🚀' },
  ];
  const doneFilters = [
    { value: 'done', label: '已完成', emoji: '✅' },
    { value: 'archived', label: '已归档', emoji: '📦' },
  ];

  // ============ 笔记详情区域（可复用） ============
  const renderNotesSection = useMemo(() => (
    <>
      {/* 桌面端：分栏布局 */}
      <div className="hidden md:flex gap-6">
        {/* 分类侧边栏 */}
        <aside className="w-48 flex-shrink-0">
          <div className="category-sidebar">
            <div className="category-sidebar-title">
              <span>分类</span>
              <button type="button"
                className="category-add-btn"
                onClick={() => { setAddingCategory(true); setNewCategoryName(''); }}
                title="新增分类"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="category-list">
              <button type="button"
                onClick={() => setActiveCategory(null)}
                className={`category-item ${!activeCategory ? 'active' : ''}`}
              >
                <span className="cat-name">
                  <span className="cat-icon">📋</span>
                  全部
                </span>
                <span className="cat-count">{activeCountNotes.length}</span>
              </button>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map(c => c.name)} strategy={verticalListSortingStrategy}>
                  {categories.map(cat => {
                    const count = activeCountNotes.filter(n => n.category === cat.name).length;
                    return (
                      <SortableCategoryItem
                        key={cat.name}
                        cat={cat}
                        active={activeCategory === cat.name}
                        count={count}
                        onClick={() => setActiveCategory(cat.name)}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
              <button type="button"
                onClick={() => setActiveCategory('__uncategorized__')}
                className={`category-item ${activeCategory === '__uncategorized__' ? 'active' : ''}`}
              >
                <span className="cat-name">
                  <span className="cat-icon">📂</span>
                  未分类
                </span>
                <span className="cat-count">{activeCountNotes.filter(n => !n.category).length}</span>
              </button>
              {addingCategory && (
                <div className="category-add-form">
                  <input
                    autoFocus
                    className="category-add-input"
                    placeholder="分类名称..."
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateCategory();
                      if (e.key === 'Escape') setAddingCategory(false);
                    }}
                    onBlur={() => {
                      if (!newCategoryName.trim()) setAddingCategory(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 min-w-0">
          {/* 状态筛选栏：活跃笔记 */}
          <div className="status-filter-bar" role="group">
            {activeFilters.map(f => {
              const count = f.value === ''
                ? categoryActiveNotes.length
                : categoryActiveNotes.filter(n => (n.status || 'note') === f.value).length;
              const StatusIcon = f.value === '' ? FileText
                : f.value === 'note' ? FileText
                : f.value === 'todo' ? Circle
                : Loader;
              return (
                <button type="button"
                  key={f.value}
                  onClick={() => handleStatusChange(f.value)}
                  className={`status-pill ${getStatusActiveClass(f.value, activeStatus)}`}
                >
                  <span className="pill-icon"><StatusIcon size={12} /></span>
                  {f.label}
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* 已完成/已归档状态栏 */}
          <div className="status-filter-bar status-filter-bar-done">
            {doneFilters.map(f => {
              const count = categoryAllNotes.filter(n => n.status === f.value).length;
              const StatusIcon = f.value === 'done' ? CheckCircle : Archive;
              return (
                <button
                  key={f.value}
                  onClick={() => handleStatusChange(f.value)}
                  className={`status-pill status-pill-done ${getStatusActiveClass(f.value, activeStatus)}`}
                >
                  <span className="pill-icon"><StatusIcon size={12} /></span>
                  {f.label}
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* 区域标题行 + 视图切换 */}
          <div className="section-header" style={{ marginTop: 20 }}>
            <div className="section-header-left">
              <span className="section-title-dot" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                全部笔记
              </span>
              <span className="section-count">{notes.length}</span>
            </div>
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('wall')}
                className={`view-btn ${viewMode === 'wall' ? 'active' : ''}`}
              >
                <LayoutGrid size={14} />
                网格
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <List size={14} />
                列表
              </button>
              <button
                onClick={() => setViewMode('swimlane')}
                className={`view-btn ${viewMode === 'swimlane' ? 'active' : ''}`}
              >
                <Columns size={14} />
                泳道
              </button>
            </div>
          </div>

          {/* 桌面版内容区域 */}
          {notes.length === 0 && !activeTag && !activeStatus ? (
            <EmptyState onCreateNote={handleCreateNote} />
          ) : viewMode === 'wall' ? (
            <CardWall
              notes={notes}
              onNoteClick={handleNoteClick}
              onDelete={handleDelete}
              onTagClick={handleTagClick}
            />
          ) : viewMode === 'list' ? (
            <SmartCardGrid
              notes={notes}
              onNoteClick={handleNoteClick}
              onDelete={handleDelete}
              onTagClick={handleTagClick}
            />
          ) : (
            <SwimlaneBoard
              notes={notes}
              categories={categories}
              onNoteClick={handleNoteClick}
              onDelete={handleDelete}
              onTagClick={handleTagClick}
              activeCategory={activeCategory}
              onCategoryClick={setActiveCategory}
              onMoveNote={handleMoveNote}
            />
          )}
        </div>
      </div>

      {/* 移动版: 标签栏 + 页面指示点 + 滑动切换 */}
      <div className="md:hidden flex flex-col" style={{ height: 'calc(100vh - 50px - 56px)' }}>
        <div className="flex-1 min-h-0">
          <SwipeStatusTabs
            allNotes={allNotes}
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
            onNoteClick={handleNoteClick}
            onDelete={handleDelete}
            onTagClick={handleTagClick}
            onCreateNote={handleCreateNote}
          />
        </div>
      </div>
    </>
  ), [notes, allNotes, categories, activeCategory, activeStatus, activeTag, viewMode, sensors,
      categoryActiveNotes, categoryAllNotes, activeCountNotes, addingCategory, newCategoryName,
      handleDragEnd, handleCreateCategory, handleStatusChange, handleNoteClick, handleDelete,
      handleTagClick, handleMoveNote, handleCreateNote, setAddingCategory, setNewCategoryName,
      setActiveCategory, setActiveStatus, setViewMode]);

  // ============ 欢迎区域（分页模式） ============
  const renderWelcomeSection = useMemo(() => (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/notes')}
          className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
            hover:border-accent hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <LayoutGrid size={20} className="text-blue-500" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-accent transition-colors">
            全部笔记
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            查看、编辑和管理所有笔记卡片
          </p>
          <span className="text-[11px] text-accent mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
            进入笔记 →
          </span>
        </button>

        <button
          onClick={() => navigate('/board')}
          className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
            hover:border-accent hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <Columns size={20} className="text-emerald-500" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-accent transition-colors">
            看板视图
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            拖拽管理笔记状态与优先级
          </p>
          <span className="text-[11px] text-accent mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
            进入看板 →
          </span>
        </button>

        <button
          onClick={() => navigate('/ai')}
          className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
            hover:border-accent hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <FileText size={20} className="text-purple-500" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-accent transition-colors">
            AI 助手
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            智能问答、任务拆解与分析
          </p>
          <span className="text-[11px] text-accent mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
            开始对话 →
          </span>
        </button>

        <button
          onClick={() => navigate('/memos')}
          className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
            hover:border-accent hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-3">
            <Plus size={20} className="text-amber-500" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-accent transition-colors">
            快捷备忘
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            快速记录灵感和随手笔记
          </p>
          <span className="text-[11px] text-accent mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
            记录备忘 →
          </span>
        </button>
      </div>
    </div>
  ), [navigate]);

  // ============ 骨架屏：notes区域加载中 ============
  const renderNotesSkeleton = () => (
    <div className="animate-fade-in space-y-4">
      <div className="hidden md:flex gap-6">
        <aside className="w-48 flex-shrink-0">
          <div className="space-y-2">
            <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg" />
            <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg" />
            <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg" />
            <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg" />
            <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg" />
          </div>
        </aside>
        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-full" />
            <div className="h-8 w-20 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-full" />
            <div className="h-8 w-20 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-full" />
            <div className="h-8 w-20 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="h-32 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-xl" />
            <div className="h-32 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-xl" />
            <div className="h-32 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && mode === 'default') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // notes模式加载中显示骨架屏
  if (mode === 'notes' && loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <CommandBar breadcrumb="笔记" showBack lastSync={null} />
        <main className="max-w-7xl mx-auto px-4 py-4">
          <div className="hidden md:flex gap-6">
            <aside className="w-48 flex-shrink-0">
              <div className="space-y-2">
                <div className="h-8 shimmer-skeleton rounded-lg" />
                <div className="h-8 shimmer-skeleton rounded-lg" />
                <div className="h-8 shimmer-skeleton rounded-lg" />
                <div className="h-8 shimmer-skeleton rounded-lg" />
              </div>
            </aside>
            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                <div className="h-8 w-20 shimmer-skeleton rounded-full" />
                <div className="h-8 w-20 shimmer-skeleton rounded-full" />
                <div className="h-8 w-20 shimmer-skeleton rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="h-32 shimmer-skeleton rounded-xl" />
                <div className="h-32 shimmer-skeleton rounded-xl" />
                <div className="h-32 shimmer-skeleton rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent text-white rounded-lg"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CommandBar
        breadcrumb={mode === 'notes' ? '笔记' : '首页'}
        showBack={mode === 'notes'}
        lastSync={lastSync}
        onRefresh={refresh}
        loading={loading}
        onVoiceInput={onVoiceInput}
      />

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {/* mode=default: 工作台 + 欢迎/笔记 */}
        {mode === 'default' && (
          <>
            <TodayFocus
              username={user?.username}
              allNotes={allNotes}
              onNoteClick={handleNoteClick}
              onCreateNote={handleCreateNote}
              onVoiceInput={onVoiceInput}
              onToggleStatus={handleToggleStatus}
              onInsightAction={(action) => {
                if (action === 'view-overdue') navigate('/ai/overdue');
                else if (action === 'view-statistics') navigate('/ai/weekly');
                else if (action === 'organize-tasks') navigate('/ai/associations');
              }}
            />

            {homeLayout === 'combined' ? (
              notesReady ? (
                <div className="animate-fade-in">
                  {renderNotesSection}
                </div>
              ) : (
                renderNotesSkeleton()
              )
            ) : (
              renderWelcomeSection
            )}
          </>
        )}

        {/* mode=notes: 仅笔记详情区域 */}
        {mode === 'notes' && renderNotesSection}
      </main>

      {(isCreating || editingNote) && (
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onClose={handleCloseEditor}
        />
      )}

      <UndoToast
        note={pendingDelete}
        countdown={countdown}
        onUndo={handleUndo}
      />

      {showOverlay && (
        <ReminderOverlay
          reminders={reminders}
          onClose={dismissOverlay}
          onNoteClick={handleReminderNoteClick}
        />
      )}

      {/* 移动端 FAB 创建按钮 */}
      <button
        onClick={handleCreateNote}
        className="fixed bottom-20 right-4 md:hidden z-40 w-14 h-14 rounded-full bg-accent text-white shadow-lg
          flex items-center justify-center active:scale-90 transition-transform"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
