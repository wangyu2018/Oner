// Mock rate limiters before any imports (hoisted by vitest)
vi.mock('../../src/middleware/rateLimiter.js', () => ({
  loginLimiter: (req, res, next) => next(),
  registerLimiter: (req, res, next) => next(),
  pinVerifyLimiter: (req, res, next) => next(),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Auth Routes', () => {
  let app;

  beforeEach(async () => {
    // 在动态导入前设置环境变量，确保 auth.js 读取到 JWT_SECRET
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: authRouter } = await import('../../src/routes/auth.js');
    app.use('/api/auth', authRouter);
  });

  afterEach(() => {
    teardownTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('缺少用户名返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'test123456' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('缺少密码返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('用户名太短（<3字符）返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'test123456' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
    });

    it('用户名太长（>20字符）返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'a'.repeat(21), password: 'test123456' });
      expect(res.status).toBe(400);
    });

    it('用户名含非法字符返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'user name!', password: 'test123456' });
      expect(res.status).toBe(400);
    });

    it('密码太短（<6字符）返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', password: '12345' });
      expect(res.status).toBe(400);
    });

    it('邮箱格式不正确返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', password: 'test123456', email: 'invalid-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('邮箱');
    });

    it('用户名已存在返回 400', async () => {
      await createTestUser({ username: 'dupuser' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'dupuser', password: 'test123456' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('已存在');
    });

    it('邮箱已被注册返回 400', async () => {
      await createTestUser({ email: 'used@test.com' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'another', password: 'test123456', email: 'used@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('邮箱');
    });

    it('成功注册返回 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'brandnew', password: 'test123456', email: 'new@test.com' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('brandnew');
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('不传邮箱也可以成功注册', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'noemail', password: 'test123456' });
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBeNull();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({ username: 'loginuser', password: 'testpass123' });
    });

    it('缺少用户名返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'testpass123' });
      expect(res.status).toBe(400);
    });

    it('缺少密码返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser' });
      expect(res.status).toBe(400);
    });

    it('用户名不存在返回 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nobody', password: 'testpass123' });
      expect(res.status).toBe(401);
    });

    it('密码错误返回 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('用户名登录成功返回 200', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'testpass123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('邮箱登录成功返回 200', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test@test.com', password: 'testpass123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('登录响应不包含密码字段', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'testpass123' });
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('多次登录创建不同 session token', async () => {
      const r1 = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'device-1')
        .send({ username: 'loginuser', password: 'testpass123' });
      const r2 = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'device-2')
        .send({ username: 'loginuser', password: 'testpass123' });
      expect(r1.body.data.token).not.toBe(r2.body.data.token);
    });
  });

  describe('POST /api/auth/mini-login', () => {
    let origAppid;
    let origSecret;

    beforeEach(() => {
      origAppid = process.env.WX_APPID;
      origSecret = process.env.WX_APPSECRET;
      process.env.WX_APPID = '';
      process.env.WX_APPSECRET = '';
    });

    afterEach(() => {
      process.env.WX_APPID = origAppid;
      process.env.WX_APPSECRET = origSecret;
    });

    it('缺少 code 返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/mini-login')
        .send({});
      expect(res.status).toBe(400);
    });

    it('模拟模式下无用户返回 500', async () => {
      const res = await request(app)
        .post('/api/auth/mini-login')
        .send({ code: 'mock-code' });
      expect(res.status).toBe(500);
    });

    it('模拟模式下有用户时返回 token', async () => {
      await createTestUser({ username: 'wxmock' });
      const res = await request(app)
        .post('/api/auth/mini-login')
        .send({ code: 'mock-code' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe('wxmock');
    });
  });

  describe('Authenticated Routes', () => {
    let testUser;
    let testToken;

    beforeEach(async () => {
      const result = await createTestUser({ username: 'authuser', password: 'testpass123' });
      testUser = result.user;
      testToken = result.token;
    });

    describe('POST /api/auth/logout', () => {
      it('无 token 返回 401', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(401);
      });

      it('成功注销返回 200', async () => {
        const res = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/auth/me', () => {
      it('无 token 返回 401', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
      });

      it('成功获取当前用户', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.user.id).toBe(testUser.id);
        expect(res.body.data.user.username).toBe('authuser');
      });
    });

    describe('GET /api/auth/sessions', () => {
      it('成功获取设备列表', async () => {
        const res = await request(app)
          .get('/api/auth/sessions')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.sessions).toBeInstanceOf(Array);
        expect(res.body.data.sessions.length).toBeGreaterThanOrEqual(1);
      });

      it('当前设备标记 isCurrent 为 true', async () => {
        const res = await request(app)
          .get('/api/auth/sessions')
          .set('Authorization', `Bearer ${testToken}`);
        const currentSession = res.body.data.sessions.find(s => s.isCurrent === true);
        expect(currentSession).toBeDefined();
      });

      it('无 token 返回 401', async () => {
        const res = await request(app).get('/api/auth/sessions');
        expect(res.status).toBe(401);
      });
    });

    describe('DELETE /api/auth/sessions/:id', () => {
      it('不存在的设备返回 404', async () => {
        const res = await request(app)
          .delete('/api/auth/sessions/nonexistent-id')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.status).toBe(404);
      });

      it('不能踢出当前设备', async () => {
        const { queryOne } = await import('../../src/db/helpers.js');
        const session = queryOne('SELECT id FROM sessions WHERE token = ?', [testToken]);
        const res = await request(app)
          .delete(`/api/auth/sessions/${session.id}`)
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('当前设备');
      });

      it('成功踢出其他设备', async () => {
        const { runQuery, queryOne } = await import('../../src/db/helpers.js');
        const sid = 'other-session-id';
        const otherToken = 'other-token-value';
        runQuery(
          "INSERT INTO sessions (id, user_id, device, token, expires_at) VALUES (?, ?, ?, ?, datetime('now', '+7 days'))",
          [sid, testUser.id, 'other-device', otherToken]
        );
        const res = await request(app)
          .delete(`/api/auth/sessions/${sid}`)
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const deleted = queryOne('SELECT id FROM sessions WHERE id = ?', [sid]);
        expect(deleted).toBeNull();
      });

      it('无 token 返回 401', async () => {
        const res = await request(app).delete('/api/auth/sessions/some-id');
        expect(res.status).toBe(401);
      });
    });

    describe('POST /api/auth/verify-vault-pin', () => {
      it('缺少 PIN 返回 400', async () => {
        const res = await request(app)
          .post('/api/auth/verify-vault-pin')
          .set('Authorization', `Bearer ${testToken}`)
          .send({});
        expect(res.status).toBe(400);
      });

      it('PIN 格式无效返回 400', async () => {
        const res = await request(app)
          .post('/api/auth/verify-vault-pin')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ pin: '12' });
        expect(res.status).toBe(400);
      });

      it('未设置 PIN 返回 400', async () => {
        const res = await request(app)
          .post('/api/auth/verify-vault-pin')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ pin: '123456' });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('未设置');
      });

      it('先设置 PIN 后验证通过', async () => {
        await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ vault_pin: '888888' });

        const res = await request(app)
          .post('/api/auth/verify-vault-pin')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ pin: '888888' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.vault_token).toBeDefined();
        expect(res.body.data.expires_at).toBeDefined();
      });
    });

    describe('PUT /api/auth/profile', () => {
      it('更新邮箱成功', async () => {
        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ email: 'newemail@test.com' });
        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe('newemail@test.com');
      });

      it('邮箱已被其他账号使用返回 400', async () => {
        await createTestUser({
          id: 'other-user-id',
          username: 'otheruser',
          email: 'other@test.com',
        });

        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ email: 'other@test.com' });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('邮箱');
      });

      it('更新头像成功', async () => {
        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ avatar: 'https://example.com/avatar.png' });
        expect(res.status).toBe(200);
        expect(res.body.data.user.avatar).toBe('https://example.com/avatar.png');
      });

      it('修改密码时当前密码错误返回 400', async () => {
        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ currentPassword: 'wrongpass', newPassword: 'newpass123' });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('当前密码');
      });

      it('修改密码成功', async () => {
        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ currentPassword: 'testpass123', newPassword: 'newpass123' });
        expect(res.status).toBe(200);

        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ username: 'authuser', password: 'newpass123' });
        expect(loginRes.status).toBe(200);
      });

      it('设置密码库 PIN 成功', async () => {
        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ vault_pin: '123456' });
        expect(res.status).toBe(200);
      });

      it('清除密码库 PIN 成功', async () => {
        await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ vault_pin: '123456' });

        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ vault_pin: '' });
        expect(res.status).toBe(200);

        const pinRes = await request(app)
          .post('/api/auth/verify-vault-pin')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ pin: '123456' });
        expect(pinRes.status).toBe(400);
        expect(pinRes.body.error).toContain('未设置');
      });
    });
  });
});
