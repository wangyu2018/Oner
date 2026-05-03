import { useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 检查登录状态
  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.auth.me();
      setUser(data.user);
      setError(null);
    } catch (err) {
      console.error('Auth check failed:', err);
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 注册
  const register = async (userData) => {
    try {
      setError(null);
      const { data } = await api.auth.register(userData);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 登录
  const login = async (credentials) => {
    try {
      setError(null);
      const { data } = await api.auth.login(credentials);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 登出
  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearToken();
      setUser(null);
    }
  };

  // 更新用户信息
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateUser,
    checkAuth,
  };
}
