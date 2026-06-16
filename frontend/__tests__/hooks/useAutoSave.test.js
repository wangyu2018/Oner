import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../../src/hooks/useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('UA-01: 自动保存草稿到 localStorage', () => {
    const data = { title: '测试', content: '草稿内容' };
    renderHook(() => useAutoSave('note-1', data, 2000));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const saved = JSON.parse(localStorage.getItem('draft-note-1'));
    expect(saved).toEqual(data);
  });

  it('UA-02: 无 noteId 时不保存', () => {
    renderHook(() => useAutoSave(null, { title: 'test' }, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem('draft-null')).toBeNull();
  });

  it('UA-03: clearDraft 清除草稿', () => {
    localStorage.setItem('draft-note-1', JSON.stringify({ title: 'test' }));

    const { result } = renderHook(() => useAutoSave('note-1', null));
    act(() => {
      result.current.clearDraft();
    });

    expect(localStorage.getItem('draft-note-1')).toBeNull();
  });

  it('UA-04: getDraft 获取草稿', () => {
    const data = { title: '已有草稿' };
    localStorage.setItem('draft-note-1', JSON.stringify(data));

    const { result } = renderHook(() => useAutoSave('note-1', null));
    const draft = result.current.getDraft();
    expect(draft).toEqual(data);
  });
});
