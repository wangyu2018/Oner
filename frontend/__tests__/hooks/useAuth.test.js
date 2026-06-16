import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';

const mockApi = vi.hoisted(() => ({
  auth: {
    me: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../../src/utils/api', () => ({
  api: mockApi,
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

import { getToken, setToken, clearToken } from '../../src/utils/api';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('UA-01: 无 token 时 user 为 null, loading 为 false', () => {
    getToken.mockReturnValue(null);
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('UA-02: 有 token 时 checkAuth 成功设置用户', async () => {
    getToken.mockReturnValue('valid-token');
    mockApi.auth.me.mockResolvedValue({ data: { user: { id: '1', username: 'test' } } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ id: '1', username: 'test' });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('UA-03: register 成功后设置 token 和用户', async () => {
    getToken.mockReturnValue(null);
    mockApi.auth.register.mockResolvedValue({ data: { token: 'new-token', user: { id: '2', username: 'newuser' } } });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.register({ username: 'newuser', password: 'pass123' });
    });

    expect(setToken).toHaveBeenCalledWith('new-token');
    expect(result.current.user).toEqual({ id: '2', username: 'newuser' });
  });

  it('UA-04: login 成功后设置 token 和用户', async () => {
    getToken.mockReturnValue(null);
    mockApi.auth.login.mockResolvedValue({ data: { token: 'login-token', user: { id: '1', username: 'test' } } });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login({ username: 'test', password: 'pass' });
    });

    expect(setToken).toHaveBeenCalledWith('login-token');
    expect(result.current.user).toEqual({ id: '1', username: 'test' });
  });

  it('UA-05: logout 清除 token 和用户', async () => {
    getToken.mockReturnValue('token');
    mockApi.auth.me.mockResolvedValue({ data: { user: { id: '1', username: 'test' } } });
    mockApi.auth.logout.mockResolvedValue({});

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(clearToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
