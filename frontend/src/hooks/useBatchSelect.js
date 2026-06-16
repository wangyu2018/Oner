import { useState, useCallback, useRef } from 'react';

/**
 * 批量选择 hook — 支持 Ctrl/Cmd+Click 多选 + 移动端长按
 * @param {Function} onBatchDelete - 批量删除回调
 * @param {Function} onBatchUpdate - 批量更新回调 (ids, updates)
 */
export function useBatchSelect({ onBatchDelete, onBatchUpdate } = {}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const longPressTimer = useRef(null);

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setBatchMode(false);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids) => {
    setSelectedIds(new Set(ids));
    if (ids.length > 0) setBatchMode(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setBatchMode(false);
  }, []);

  // 进入批量模式（长按触发）
  const enterBatchMode = useCallback((id) => {
    setBatchMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  // 点击处理：批量模式下切换选择，非批量模式忽略（由外部 onClick 处理）
  const handleClick = useCallback(
    (id, e) => {
      if (batchMode) {
        e?.stopPropagation?.();
        toggleSelect(id);
        return true; // 已处理
      }
      if (e?.ctrlKey || e?.metaKey) {
        e?.stopPropagation?.();
        setBatchMode(true);
        toggleSelect(id);
        return true;
      }
      return false; // 未处理，交给默认 onClick
    },
    [batchMode, toggleSelect]
  );

  // 长按开始（移动端）
  const handleLongPressStart = useCallback(
    (id) => {
      longPressTimer.current = setTimeout(() => {
        enterBatchMode(id);
      }, 500);
    },
    [enterBatchMode]
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // 批量操作
  const batchDelete = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    try {
      await onBatchDelete?.(ids);
      clearSelection();
    } catch (err) {
      console.error('Batch delete failed:', err);
    }
  }, [selectedIds, onBatchDelete, clearSelection]);

  const batchUpdateStatus = useCallback(
    async (status) => {
      const ids = [...selectedIds];
      if (ids.length === 0) return;
      try {
        await onBatchUpdate?.(ids, { status });
        clearSelection();
      } catch (err) {
        console.error('Batch update status failed:', err);
      }
    },
    [selectedIds, onBatchUpdate, clearSelection]
  );

  const batchUpdatePriority = useCallback(
    async (priority) => {
      const ids = [...selectedIds];
      if (ids.length === 0) return;
      try {
        await onBatchUpdate?.(ids, { priority });
        clearSelection();
      } catch (err) {
        console.error('Batch update priority failed:', err);
      }
    },
    [selectedIds, onBatchUpdate, clearSelection]
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    batchMode,
    setBatchMode,
    isSelected,
    toggleSelect,
    selectAll,
    clearSelection,
    enterBatchMode,
    handleClick,
    handleLongPressStart,
    handleLongPressEnd,
    batchDelete,
    batchUpdateStatus,
    batchUpdatePriority,
  };
}
