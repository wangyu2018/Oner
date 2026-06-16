import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

const mockRegister = vi.hoisted(() => vi.fn());

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

import Register from '../../src/pages/Register';

const renderRegister = () => render(
  <BrowserRouter><Register /></BrowserRouter>
);

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('RP-01: 渲染注册表单元素', () => {
    renderRegister();
    expect(screen.getByText('创建账号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('3-20 个字符')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('至少 6 个字符')).toBeInTheDocument();
    expect(screen.getByText('注册 →')).toBeInTheDocument();
    expect(screen.getByText('立即登录')).toBeInTheDocument();
  });

  it('RP-02: 空表单提交显示错误', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByText('注册 →'));
    expect(screen.getByText('用户名和密码必填')).toBeInTheDocument();
  });

  it('RP-03: 用户名长度验证', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText('3-20 个字符'), 'ab');
    await user.type(screen.getByPlaceholderText('至少 6 个字符'), 'pass123');
    await user.click(screen.getByText('注册 →'));
    expect(screen.getByText('用户名长度需在 3-20 个字符之间')).toBeInTheDocument();
  });

  it('RP-04: 密码长度验证', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText('3-20 个字符'), 'testuser');
    await user.type(screen.getByPlaceholderText('至少 6 个字符'), '123');
    await user.click(screen.getByText('注册 →'));
    expect(screen.getByText('密码长度至少 6 个字符')).toBeInTheDocument();
  });

  it('RP-05: 密码不一致验证', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText('3-20 个字符'), 'testuser');
    await user.type(screen.getByPlaceholderText('至少 6 个字符'), 'password123');
    await user.type(screen.getAllByPlaceholderText('再次输入密码')[0], 'different');
    await user.click(screen.getByText('注册 →'));
    expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
  });

  it('RP-06: 成功注册调用 register', async () => {
    mockRegister.mockResolvedValue();
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText('3-20 个字符'), 'newuser');
    const passInput = screen.getByPlaceholderText('至少 6 个字符');
    await user.type(passInput, 'password123');
    const confirmInput = document.querySelector('input[placeholder="再次输入密码"]');
    await user.type(confirmInput, 'password123');
    await user.click(screen.getByText('注册 →'));
    expect(mockRegister).toHaveBeenCalledWith({
      username: 'newuser',
      email: undefined,
      password: 'password123',
    });
  });
});
