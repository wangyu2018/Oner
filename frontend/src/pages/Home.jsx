import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Columns, FileText, Circle, Loader, CheckCircle } from 'lucide-react';
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
import { useAuthContext } from '../App';
import { api } from '../utils/api';

// 状态筛选 -> CSS active class
function getStatusActiveClass(status) {
  const map = { '': 'active-all', note: 'active-memo', todo: 'active-todo', in_progress: 'active-progress', done: 'active-done' };
  return map[status] || 'active-all';
}

export default function Home({ categories = [], onVoiceInput }) {
  const {
    notes,
    allNotes,
    loading,
    error,
    activeTag,
    setActiveTag,
    activeStatus,
    setActiveStatus,
    lastSync,
    refresh,
    createNote,
    updateNote,
    removeNoteFromState,
    addNoteToState
  } = useNotes();

  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [editingNote, setEditingNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState('wall');
  const [activeCategory, setActiveCategory] = useState(null);

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
  const statusFilters = [
    { value: '', label: '全部', emoji: '📋' },
    { value: 'note', label: '备忘', emoji: '📝' },
    { value: 'todo', label: '待办', emoji: '⏰' },
    { value: 'in_progress', label: '进行中', emoji: '🚀' },
    { value: 'done', label: '已完成', emoji: '✅' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
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
        breadcrumb="首页"
        lastSync={lastSync}
        onRefresh={refresh}
        loading={loading}
        onVoiceInput={onVoiceInput}
      />

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {/* 今日焦点模块 */}
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

        {/* 桌面端：分栏布局 */}
        <div className="hidden md:flex gap-6">
          {/* 分类侧边栏 */}
          <aside className="w-48 flex-shrink-0">
            <div className="category-sidebar">
              <div className="category-sidebar-title">分类</div>
              <div className="category-list">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`category-item ${!activeCategory ? 'active' : ''}`}
                >
                  <span className="cat-name">
                    <span className="cat-icon">📋</span>
                    全部
                  </span>
                  <span className="cat-count">{allNotes.length}</span>
                </button>
                {categories.map(cat => {
                  const count = allNotes.filter(n => n.category === cat.name).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                    >
                      <span className="cat-name">
                        <span className="cat-icon">{cat.icon || '📌'}</span>
                        {cat.name}
                      </span>
                      <span className="cat-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* 主内容区 */}
          <div className="flex-1 min-w-0">
            {/* 状态筛选标签栏 */}
            <div className="status-filter-bar" role="group">
              {statusFilters.map(f => {
                const count = f.value === ''
                  ? allNotes.length
                  : allNotes.filter(n => (n.status || 'note') === f.value).length;
                const StatusIcon = f.value === '' ? FileText
                  : f.value === 'note' ? FileText
                  : f.value === 'todo' ? Circle
                  : f.value === 'in_progress' ? Loader
                  : CheckCircle;
                return (
                  <button
                    key={f.value}
                    onClick={() => handleStatusChange(f.value)}
                    className={`status-pill ${getStatusActiveClass(f.value)}`}
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
