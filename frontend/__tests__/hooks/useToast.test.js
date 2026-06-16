import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useToast } from '../../src/hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('UT-01: 初始 toasts 为空', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('UT-02: addToast 添加通知', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast({ message: '测试通知', type: 'info' });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('测试通知');
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('UT-03: warning 快捷方法', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.warning('警告消息');
    });
    expect(result.current.toasts[0].type).toBe('warning');
  });

  it('UT-04: 自动消失 (autoDismiss)', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast({ message: '消失测试', autoDismiss: true, duration: 3000 });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('UT-05: removeToast 手动移除', () => {
    const { result } = renderHook(() => useToast());
    let id;
    act(() => {
      id = result.current.addToast({ message: '手动移除' });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('UT-06: error 默认持续时间 5000', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.error('错误消息');
    });
    expect(result.current.toasts[0].duration).toBe(5000);
  });
});
