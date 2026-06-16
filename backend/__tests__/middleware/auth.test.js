import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// 在加载 auth 模块前先 mock queryOne
const mockQueryOne = vi.fn();
vi.mock('../../src/db/helpers.js', () => ({
  queryOne: (...args) => mockQueryOne(...args),
  queryAll: vi.fn(),
  runQuery: vi.fn(),
}));

describe('auth middleware', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    app = express();
  });

  afterEach(() => {
    delete require?.cache?.[require?.resolve?.('../../src/middleware/auth.js')];
  });

  describe('authMiddleware', () => {
    it('MW-01: 无 Authorization header 返回 401', async () => {
      const { authMiddleware } = await import('../../src/middleware/auth.js');
      app.get('/test', authMiddleware, (req, res) => res.json({ ok: true }));

      const res = await request(app).get('/test');
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('MW-02: 非 Bearer token 返回 401', async () => {
      const { authMiddleware } = await import('../../src/middleware/auth.js');
      app.get('/test', authMiddleware, (req, res) => res.json({ ok: true }));

      const res = await request(app).get('/test').set('Authorization', 'Basic xxx');
      expect(res.status).toBe(401);
    });

    it('MW-03: 空 Bearer token 返回 401', async () => {
      const { authMiddleware } = await import('../../src/middleware/auth.js');
      app.get('/test', authMiddleware, (req, res) => res.json({ ok: true }));

      const res = await request(app).get('/test').set('Authorization', 'Bearer ');
      expect(res.status).toBe(401);
    });

    it('MW-04: 无效 JWT token 返回 401', async () => {
      const { authMiddleware } = await import('../../src/middleware/auth.js');
      app.get('/test', authMiddleware, (req, res) => res.json({ ok: true }));

      const res = await request(app).get('/test').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('MW-09: JWT 有效但用户被删除返回 401', async () => {
      const { authMiddleware, generateToken } = await import('../../src/middleware/auth.js');
      app.get('/test', authMiddleware, (req, res) => res.json({ ok: true, userId: req.user.id }));

      const token = generateToken('nonexistent-user');
      // session 存在但用户不存在
      mockQueryOne.mockReturnValueOnce({ id: 's1', token, user_id: 'nonexistent-user' }); // session
      mockQueryOne.mockReturnValueOnce(null); // user not found

      const res = await request(app).get('/test').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
    });

    it('MW-11: 有效 token 正常通过', async () => {
      const { authMiddleware, generateToken } = await import('../../src/middleware/auth.js');
      app.get('/test', authMiddleware, (req, res) => res.json({ ok: true, userId: req.user.id }));

      const token = generateToken('user-1');
      mockQueryOne.mockReturnValueOnce({ id: 's1', token, user_id: 'user-1' }); // session
      mockQueryOne.mockReturnValueOnce({ id: 'user-1', username: 'test' }); // user

      const res = await request(app).get('/test').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe('user-1');
    });
  });

  describe('optionalAuth', () => {
    it('MW-12: optionalAuth 无 token 时 req.user = null', async () => {
      const { optionalAuth } = await import('../../src/middleware/auth.js');
      app.get('/test', optionalAuth, (req, res) => res.json({ userId: req.user }));

      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.body.userId).toBeNull();
    });

    it('MW-13: optionalAuth 有效 token 时 req.user 存在', async () => {
      const { optionalAuth, generateToken } = await import('../../src/middleware/auth.js');
      app.get('/test', optionalAuth, (req, res) => res.json({ userId: req.user?.id }));

      const token = generateToken('user-2');
      mockQueryOne.mockReturnValueOnce({ id: 'user-2', username: 'test' }); // user

      const res = await request(app).get('/test').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe('user-2');
    });
  });
});
