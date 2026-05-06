import React, { useState, useCallback } from 'react';
import Toolbar from '../components/Toolbar';
import EmptyState from '../components/EmptyState';
import CardWall from '../components/CardWall';
import NoteEditor from '../components/NoteEditor';
import UndoToast from '../components/UndoToast';
import ReminderOverlay from '../components/ReminderOverlay';
import SwipeStatusTabs from '../components/SwipeStatusTabs';
import QuickEntryBar from '../components/QuickEntryBar';
import VoiceInput from '../components/VoiceInput';
import { useNotes } from '../hooks/useNotes';
import { useUndoDelete } from '../hooks/useUndoDelete';
import { useReminderCheck } from '../hooks/useReminderCheck';

export default function Home() {
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

  const [editingNote, setEditingNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);

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

  // 语音输入保存
  const handleVoiceSave = useCallback(async (data) => {
    await createNote(data);
  }, [createNote]);

  // 快捷录入栏快速创建
  const handleQuickCreate = useCallback(async (data) => {
    await createNote(data);
  }, [createNote]);

  // 从提醒浮层打开笔记
  const handleReminderNoteClick = useCallback((item) => {
    const note = allNotes.find((n) => n.id === item.id);
    if (note) {
      setEditingNote(note);
      setIsCreating(false);
    }
  }, [allNotes]);

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
      <Toolbar
        onCreateNote={handleCreateNote}
        activeTag={activeTag}
        onClearTag={handleClearTag}
        activeStatus={activeStatus}
        onStatusChange={handleStatusChange}
        lastSync={lastSync}
        onRefresh={refresh}
        loading={loading}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
        {/* 桌面版: 原有 CardWall 布局 */}
        <div className="hidden md:block">
          {notes.length === 0 && !activeTag && !activeStatus ? (
            <EmptyState onCreateNote={handleCreateNote} />
          ) : (
            <CardWall
              notes={notes}
              onNoteClick={handleNoteClick}
              onDelete={handleDelete}
              onTagClick={handleTagClick}
            />
          )}
        </div>

        {/* 移动版: 标签栏 + 页面指示点 + 滑动切换 */}
        <div className="md:hidden flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
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
          <QuickEntryBar
            onCreateNote={handleQuickCreate}
            onVoiceInput={() => setShowVoiceInput(true)}
          />
        </div>
      </main>

      {/* 桌面版快捷录入栏 - 全宽固定底部 */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-30">
        <QuickEntryBar
          onCreateNote={handleQuickCreate}
          onVoiceInput={() => setShowVoiceInput(true)}
        />
      </div>

      {(isCreating || editingNote) && (
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onClose={handleCloseEditor}
        />
      )}

      {showVoiceInput && (
        <VoiceInput
          onSave={handleVoiceSave}
          onClose={() => setShowVoiceInput(false)}
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
    </div>
  );
}
