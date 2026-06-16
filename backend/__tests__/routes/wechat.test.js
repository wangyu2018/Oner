import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('WeChat Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: wechatRouter } = await import('../../src/routes/wechat.js');
    app.use('/api/wechat', wechatRouter);

    const result = await createTestUser({ username: 'wxuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  describe('POST /api/wechat/subscribe', () => {
    it('WX-01: 缺少必要参数返回 400', async () => {
      const res = await request(app)
        .post('/api/wechat/subscribe')
        .set(auth())
        .send({ template_id: 'tpl1' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('openid');
    });

    it('WX-02: 创建新订阅成功', async () => {
      const res = await request(app)
        .post('/api/wechat/subscribe')
        .set(auth())
        .send({ template_id: 'tpl1', openid: 'openid123', remind_type: 'todo_due' });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('已订阅');
    });
  });

  describe('GET /api/wechat/subscriptions', () => {
    it('WX-03: 订阅列表为空', async () => {
      const res = await request(app).get('/api/wechat/subscriptions').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.subscriptions).toEqual([]);
    });
  });

  describe('DELETE /api/wechat/subscriptions/:id', () => {
    it('WX-04: 删除不存在的订阅返回 404', async () => {
      const res = await request(app).delete('/api/wechat/subscriptions/nonexistent').set(auth());
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('不存在');
    });
  });
});
