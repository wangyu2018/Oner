import React, { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import CommandBar from '../components/CommandBar';
import TodayFocus from '../components/TodayFocus';
import TodayStrip from '../components/TodayStrip';
import EmptyState from '../components/EmptyState';
import CardWall from '../components/CardWall';
import SwimlaneBoard from '../components/SwimlaneBoard';
import NoteEditor from '../components/NoteEditor';
import UndoToast from '../components/UndoToast';
import ReminderOverlay from '../components/ReminderOverlay';
import SwipeStatusTabs from '../components/SwipeStatusTabs';
import { useNotes } from '../hooks/useNotes';
import { useUndoDelete } from '../hooks/useUndoDelete';
import { useReminderCheck } from '../hooks/useReminderCheck';
import { useAuthContext } from '../App';

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
        onOpenPalette={() => {}}
        lastSync={lastSync}
        onRefresh={refresh}
        loading={loading}
        onVoiceInput={onVoiceInput}
      />

      <TodayStrip notes={allNotes} onNoteClick={handleNoteClick} />

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {/* 今日焦点模块 */}
        <TodayFocus
          username={user?.username}
          allNotes={allNotes}
          onNoteClick={handleNoteClick}
          onCreateNote={handleCreateNote}
          onVoiceInput={onVoiceInput}
        />

        {/* 视图切换分界线 */}
        <div className="flex items-center gap-3 pt-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            全部笔记
          </h2>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setViewMode('wall')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                viewMode === 'wall'
                  ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-xs'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              网格
            </button>
            <button
              onClick={() => setViewMode('swimlane')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                viewMode === 'swimlane'
                  ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-xs'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              泳道
            </button>
          </div>
        </div>

        {/* 桌面版: 网格 ↔ 泳道切换 */}
        <div className="hidden md:block">
          {notes.length === 0 && !activeTag && !activeStatus ? (
            <EmptyState onCreateNote={handleCreateNote} />
          ) : viewMode === 'wall' ? (
            <CardWall
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
