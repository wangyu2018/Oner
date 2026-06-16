import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoDelete } from '../../src/hooks/useUndoDelete';

const mockApi = vi.hoisted(() => ({
  notes: {
    delete: vi.fn(),
  },
}));

vi.mock('../../src/utils/api', () => ({
  api: mockApi,
}));

describe('useUndoDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('UD-01: startDelete 设置 pendingDelete', () => {
    const onDeleteSuccess = vi.fn();
    const { result } = renderHook(() => useUndoDelete(onDeleteSuccess));

    const note = { id: 'n1', title: '待删除笔记' };
    act(() => {
      result.current.startDelete(note);
    });

    expect(result.current.pendingDelete).toEqual(note);
    expect(result.current.countdown).toBe(5);
  });

  it('UD-02: 5秒后自动确认删除', async () => {
    const onDeleteSuccess = vi.fn();
    mockApi.notes.delete.mockResolvedValue({});

    const { result } = renderHook(() => useUndoDelete(onDeleteSuccess));

    act(() => {
      result.current.startDelete({ id: 'n1', title: 'test' });
    });

    expect(result.current.countdown).toBe(5);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mockApi.notes.delete).toHaveBeenCalledWith('n1');
    expect(onDeleteSuccess).toHaveBeenCalled();
    expect(result.current.pendingDelete).toBeNull();
  });

  it('UD-03: undoDelete 取消删除', () => {
    const onDeleteSuccess = vi.fn();

    const { result } = renderHook(() => useUndoDelete(onDeleteSuccess));

    act(() => {
      result.current.startDelete({ id: 'n1', title: 'test' });
    });
    expect(result.current.countdown).toBe(5);

    act(() => {
      result.current.undoDelete();
    });

    expect(result.current.pendingDelete).toBeNull();
    expect(result.current.countdown).toBe(0);

    // 5秒后不应调用 delete
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockApi.notes.delete).not.toHaveBeenCalled();
  });

  it('UD-04: countdown 递减', () => {
    const { result } = renderHook(() => useUndoDelete(vi.fn()));

    act(() => {
      result.current.startDelete({ id: 'n1', title: 'test' });
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).toBe(4);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.countdown).toBe(2);
  });
});
