import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

const mockLogin = vi.hoisted(() => vi.fn());

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

import Login from '../../src/pages/Login';

const renderLogin = () => render(
  <BrowserRouter><Login /></BrowserRouter>
);

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('LP-01: 渲染登录表单元素', () => {
    renderLogin();
    expect(screen.getByText('欢迎回来')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('请输入')).toHaveLength(2);
    expect(screen.getByText('登录 →')).toBeInTheDocument();
    expect(screen.getByText('立即注册')).toBeInTheDocument();
  });

  it('LP-02: 空表单提交显示错误提示', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByText('登录 →'));
    expect(screen.getByText('请输入用户名和密码')).toBeInTheDocument();
  });

  it('LP-03: 填写内容后提交调用 login', async () => {
    mockLogin.mockResolvedValue();
    const user = userEvent.setup();
    renderLogin();
    const inputs = screen.getAllByPlaceholderText('请输入');
    await user.type(inputs[0], 'testuser');
    await user.type(inputs[1], 'password123');
    await user.click(screen.getByText('登录 →'));
    expect(mockLogin).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
  });

  it('LP-04: 登录失败显示错误信息', async () => {
    mockLogin.mockRejectedValue(new Error('用户名或密码错误'));
    const user = userEvent.setup();
    renderLogin();
    const inputs = screen.getAllByPlaceholderText('请输入');
    await user.type(inputs[0], 'testuser');
    await user.type(inputs[1], 'wrong');
    await user.click(screen.getByText('登录 →'));
    expect(await screen.findByText('用户名或密码错误')).toBeInTheDocument();
  });

  it('LP-05: 显示密码切换功能', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getAllByPlaceholderText('请输入')[1];
    expect(passwordInput.type).toBe('password');
    const toggleBtn = document.querySelector('button[type="button"]');
    await user.click(toggleBtn);
    expect(passwordInput.type).toBe('text');
  });
});
