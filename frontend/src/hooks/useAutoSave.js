import { useEffect, useRef, useCallback } from 'react';

export function useAutoSave(noteId, data, delay = 2000) {
  const timeoutRef = useRef(null);

  const saveDraft = useCallback(() => {
    if (!noteId || !data) return;
    const key = `draft-${noteId}`;
    localStorage.setItem(key, JSON.stringify(data));
  }, [noteId, data]);

  useEffect(() => {
    if (!noteId || !data) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [noteId, data, delay, saveDraft]);

  const clearDraft = useCallback(() => {
    if (!noteId) return;
    localStorage.removeItem(`draft-${noteId}`);
  }, [noteId]);

  const getDraft = useCallback(() => {
    if (!noteId) return null;
    const saved = localStorage.getItem(`draft-${noteId}`);
    return saved ? JSON.parse(saved) : null;
  }, [noteId]);

  return { clearDraft, getDraft, saveDraft };
}
