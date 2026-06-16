import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotes } from '../../src/hooks/useNotes';

const mockApi = vi.hoisted(() => ({
  notes: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/utils/api', () => ({
  api: mockApi,
}));

describe('useNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('UN-01: 初始加载状态', () => {
    mockApi.notes.list.mockResolvedValue({ data: { notes: [] } });
    const { result } = renderHook(() => useNotes());
    expect(result.current.loading).toBe(true);
  });

  it('UN-02: fetchNotes 加载笔记列表', async () => {
    const notes = [
      { id: 'n1', title: '笔记1', tags: ['work'], status: 'todo', category: '' },
      { id: 'n2', title: '笔记2', tags: [], status: 'note', category: '' },
    ];
    mockApi.notes.list.mockResolvedValue({ data: { notes } });

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allNotes).toHaveLength(2);
  });

  it('UN-03: createNote 创建笔记并添加到列表', async () => {
    mockApi.notes.list.mockResolvedValue({ data: { notes: [] } });
    const newNote = { id: 'n3', title: '新笔记', tags: [], status: 'note', category: '' };
    mockApi.notes.create.mockResolvedValue({ data: { note: newNote } });

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createNote({ title: '新笔记' });
    });

    expect(result.current.allNotes).toHaveLength(1);
    expect(result.current.allNotes[0].title).toBe('新笔记');
  });

  it('UN-04: updateNote 更新笔记', async () => {
    const notes = [{ id: 'n1', title: '旧标题', tags: [], status: 'todo', category: '' }];
    mockApi.notes.list.mockResolvedValue({ data: { notes } });
    const updatedNote = { id: 'n1', title: '新标题', tags: [], status: 'todo', category: '' };
    mockApi.notes.update.mockResolvedValue({ data: { note: updatedNote } });

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateNote('n1', { title: '新标题' });
    });

    expect(result.current.allNotes[0].title).toBe('新标题');
  });

  it('UN-05: deleteNote 删除笔记并从列表移除', async () => {
    const notes = [{ id: 'n1', title: '待删除', tags: [], status: 'todo', category: '' }];
    mockApi.notes.list.mockResolvedValue({ data: { notes } });
    mockApi.notes.delete.mockResolvedValue({});

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allNotes).toHaveLength(1);

    await act(async () => {
      await result.current.deleteNote('n1');
    });

    expect(result.current.allNotes).toHaveLength(0);
  });

  it('UN-06: 过滤笔记按 activeTag', async () => {
    const notes = [
      { id: 'n1', title: '工作笔记', tags: ['work'], status: 'todo', category: '' },
      { id: 'n2', title: '个人笔记', tags: ['personal'], status: 'note', category: '' },
    ];
    mockApi.notes.list.mockResolvedValue({ data: { notes } });

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setActiveTag('work');
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].title).toBe('工作笔记');
  });
});
