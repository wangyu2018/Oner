import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJSON, api, getToken, setToken, clearToken } from '../../src/utils/api';

describe('api utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('API-01: fetchJSON 自动添加 Authorization header', async () => {
    setToken('test-token');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await fetchJSON('/test');
    const call = global.fetch.mock.calls[0];
    expect(call[1].headers.Authorization).toBe('Bearer test-token');
  });

  it('API-02: 401 响应触发跳转到 /login', async () => {
    setToken('expired-token');
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, pathname: '/notes', href: '' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Token expired' }),
    });

    await expect(fetchJSON('/notes')).rejects.toThrow();
    expect(window.location.href).toContain('/login');
    expect(getToken()).toBeNull();

    window.location = originalLocation;
  });

  it('API-03: 查询参数正确拼接', async () => {
    setToken('test');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { notes: [] } }),
    });

    await api.notes.list({ tag: 'work', status: 'todo', limit: 20 });
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('tag=work');
    expect(url).toContain('status=todo');
    expect(url).toContain('limit=20');
  });

  it('API-04: 文件上传使用 FormData', async () => {
    setToken('test');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    await api.files.upload('note1', file);

    const call = global.fetch.mock.calls[0];
    expect(call[0]).toContain('/files/upload');
    expect(call[1].method).toBe('POST');
    expect(call[1].body).toBeInstanceOf(FormData);
    expect(call[1].headers.Authorization).toBe('Bearer test');
  });
});
