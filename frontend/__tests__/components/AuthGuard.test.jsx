import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const authState = vi.hoisted(() => ({ current: { isAuthenticated: false, loading: true } }));

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => authState.current,
}));
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div>redirect:{to}</div>,
  useLocation: () => ({}),
}));

import AuthGuard from '../../src/components/AuthGuard';

describe('AuthGuard', () => {
  beforeEach(() => {
    authState.current = { isAuthenticated: false, loading: true };
  });

  it('AG-01: loading 时显示 spinner', () => {
    const { container } = render(<AuthGuard><div>content</div></AuthGuard>);
    expect(screen.queryByText('content')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('AG-02: 未认证时显示重定向', () => {
    authState.current = { isAuthenticated: false, loading: false };
    render(<AuthGuard><div>content</div></AuthGuard>);
    expect(screen.queryByText('content')).not.toBeInTheDocument();
    expect(screen.getByText('redirect:/login')).toBeInTheDocument();
  });

  it('AG-03: 已认证时显示 children', () => {
    authState.current = { isAuthenticated: true, loading: false };
    render(<AuthGuard><div>content</div></AuthGuard>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
