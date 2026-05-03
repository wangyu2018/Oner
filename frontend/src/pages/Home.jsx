import React, { useState, useCallback } from 'react';
import Toolbar from '../components/Toolbar';
import EmptyState from '../components/EmptyState';
import CardWall from '../components/CardWall';
import NoteEditor from '../components/NoteEditor';
import UndoToast from '../components/UndoToast';
import { useNotes } from '../hooks/useNotes';
import { useUndoDelete } from '../hooks/useUndoDelete';

export default function Home() {
  const {
    notes,
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

  const handleDeleteSuccess = useCallback(() => {
    // Refresh notes after confirmed delete
  }, []);

  const { pendingDelete, countdown, startDelete, undoDelete } = useUndoDelete(handleDeleteSuccess);

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

      <main className="max-w-7xl mx-auto px-4 py-6">
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
    </div>
  );
}
