import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Settings Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: settingsRouter } = await import('../../src/routes/settings.js');
    app.use('/api/settings', settingsRouter);

    const result = await createTestUser({ username: 'setuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  describe('GET /api/settings', () => {
    it('SE-01: 无设置时返回空对象', async () => {
      const res = await request(app).get('/api/settings').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data).toBe('object');
    });

    it('SE-02: AI API Key 不返回明文只返回 hasKey', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      const { encryptVaultPassword } = await import('../../src/utils/crypto.js');
      const encryptedKey = encryptVaultPassword('sk-my-secret-key');
      runQuery(
        "INSERT INTO user_settings (user_id, settings) VALUES (?, ?)",
        [testUser.id, JSON.stringify({ ai: { provider: 'deepseek', apiKey: encryptedKey, model: 'deepseek-chat' } })]
      );

      const res = await request(app).get('/api/settings').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.ai.apiKey).toBeUndefined();
      expect(res.body.data.ai.hasKey).toBe(true);
    });
  });

  describe('PUT /api/settings', () => {
    it('SE-03: 设置格式无效返回 400', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set(auth())
        .send({ settings: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('格式无效');
    });

    it('SE-04: 更新主题设置成功', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set(auth())
        .send({ settings: { theme: 'dark' } });
      expect(res.status).toBe(200);
      expect(res.body.data.theme).toBe('dark');
    });
  });
});
