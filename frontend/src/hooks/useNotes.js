import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { api } from '../utils/api';

// 同步间隔（毫秒）
const SYNC_INTERVAL = 30000; // 30 秒

export function useNotes() {
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [activeStatus, setActiveStatus] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // 客户端过滤：根据 activeTag / activeStatus / activeCategory 过滤笔记
  const notes = useMemo(() => {
    let result = allNotes;
    if (activeTag) {
      result = result.filter(n => n.tags && n.tags.includes(activeTag));
    }
    if (activeCategory) {
      if (activeCategory === '__uncategorized__') {
        result = result.filter(n => !n.category);
      } else {
        result = result.filter(n => n.category === activeCategory);
      }
    }
    if (activeStatus) {
      result = result.filter(n => (n.status || 'note') === activeStatus);
    } else if (!activeCategory) {
      // 全部视图（无分类、无状态筛选）：排除已归档和已完成
      result = result.filter(n => n.status !== 'archived' && n.status !== 'done');
    } else {
      // 分类视图排除已归档
      result = result.filter(n => n.status !== 'archived');
    }
    return result;
  }, [allNotes, activeTag, activeStatus, activeCategory]);

  // 获取全部笔记（不传 status 过滤参数）
  const fetchNotes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const data = await api.notes.list({});

      if (isMountedRef.current) {
        setAllNotes(data.data.notes);
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

  // 初始加载 + 定时轮询
  useEffect(() => {
    isMountedRef.current = true;
    fetchNotes(true);

    intervalRef.current = setInterval(() => {
      fetchNotes(false);
    }, SYNC_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotes]);

  // 创建笔记
  const createNote = useCallback(async (note) => {
    const data = await api.notes.create(note);
    setAllNotes(prev => [data.data.note, ...prev]);
    return data.data.note;
  }, []);

  // 更新笔记
  const updateNote = useCallback(async (id, updates) => {
    const data = await api.notes.update(id, updates);
    setAllNotes(prev => prev.map(n => n.id === id ? data.data.note : n));
    return data.data.note;
  }, []);

  // 删除笔记
  const deleteNote = useCallback(async (id) => {
    await api.notes.delete(id);
    setAllNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // 从状态中移除笔记（乐观更新）
  const removeNoteFromState = useCallback((id) => {
    setAllNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // 添加笔记到状态（乐观更新）
  const addNoteToState = useCallback((note) => {
    setAllNotes(prev => [note, ...prev]);
  }, []);

  // 手动刷新
  const refresh = useCallback(() => {
    fetchNotes(true);
  }, [fetchNotes]);

  return {
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
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    removeNoteFromState,
    addNoteToState,
    refresh,
  };
}
