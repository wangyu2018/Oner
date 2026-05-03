import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../utils/api';

// 同步间隔（毫秒）
const SYNC_INTERVAL = 30000; // 30 秒

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [activeStatus, setActiveStatus] = useState('');
  const [lastSync, setLastSync] = useState(null);

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // 获取笔记列表
  const fetchNotes = useCallback(async (tag, status, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const params = {};
      if (tag) params.tag = tag;
      if (status) params.status = status;

      const data = await api.notes.list(params);

      if (isMountedRef.current) {
        setNotes(data.data.notes);
        setLastSync(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // 初始加载
  useEffect(() => {
    isMountedRef.current = true;
    fetchNotes(activeTag, activeStatus);

    // 设置轮询
    intervalRef.current = setInterval(() => {
      fetchNotes(activeTag, activeStatus, false);
    }, SYNC_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotes, activeTag, activeStatus]);

  // 创建笔记
  const createNote = useCallback(async (note) => {
    const data = await api.notes.create(note);
    setNotes(prev => [data.data.note, ...prev]);
    return data.data.note;
  }, []);

  // 更新笔记
  const updateNote = useCallback(async (id, updates) => {
    const data = await api.notes.update(id, updates);
    setNotes(prev => prev.map(n => n.id === id ? data.data.note : n));
    return data.data.note;
  }, []);

  // 删除笔记
  const deleteNote = useCallback(async (id) => {
    await api.notes.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // 从状态中移除笔记（乐观更新）
  const removeNoteFromState = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // 添加笔记到状态（乐观更新）
  const addNoteToState = useCallback((note) => {
    setNotes(prev => [note, ...prev]);
  }, []);

  // 手动刷新
  const refresh = useCallback(() => {
    fetchNotes(activeTag, activeStatus, true);
  }, [fetchNotes, activeTag, activeStatus]);

  return {
    notes,
    loading,
    error,
    activeTag,
    setActiveTag,
    activeStatus,
    setActiveStatus,
    lastSync,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    removeNoteFromState,
    addNoteToState,
    refresh,
  };
}
