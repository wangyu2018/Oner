import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../utils/api';

export function useUndoDelete(onDeleteSuccess) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const confirmDelete = useCallback(async (note) => {
    try {
      await api.notes.delete(note.id);
      onDeleteSuccess?.();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  }, [onDeleteSuccess]);

  const startDelete = useCallback((note) => {
    // If there's already a pending delete, confirm it immediately
    if (pendingDelete) {
      clearTimers();
      confirmDelete(pendingDelete);
    }

    // Set the new pending delete
    setPendingDelete(note);
    setCountdown(5);

    // Start countdown
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set timer to confirm delete after 5 seconds
    timerRef.current = setTimeout(() => {
      confirmDelete(note);
      setPendingDelete(null);
      setCountdown(0);
    }, 5000);
  }, [pendingDelete, clearTimers, confirmDelete]);

  const undoDelete = useCallback(() => {
    clearTimers();
    setPendingDelete(null);
    setCountdown(0);
  }, [clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (pendingDelete) {
        confirmDelete(pendingDelete);
      }
    };
  }, []);

  return {
    pendingDelete,
    countdown,
    startDelete,
    undoDelete
  };
}
