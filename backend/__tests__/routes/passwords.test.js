import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Passwords Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: passwordsRouter } = await import('../../src/routes/passwords.js');
    app.use('/api/passwords', passwordsRouter);

    const result = await createTestUser({ username: 'pwuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  async function createEntry(overrides = {}) {
    const { runQuery, queryOne } = await import('../../src/db/helpers.js');
    const crypto = await import('crypto');
    const { encryptVaultPassword } = await import('../../src/utils/crypto.js');
    const id = overrides.id || crypto.default.randomUUID().replace(/-/g, '').slice(0, 16);
    const encrypted = encryptVaultPassword(overrides.password || 'secret123');

    runQuery(
      `INSERT INTO password_entries (id, user_id, title, url, username, encrypted_password, notes, category, include_in_search, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, testUser.id, overrides.title || '测试条目', overrides.url || '',
       overrides.username || 'user', encrypted, overrides.notes || '',
       overrides.category || '', overrides.include_in_search !== undefined ? (overrides.include_in_search ? 1 : 0) : 0]
    );
    return { id, ...overrides };
  }

  describe('GET /api/passwords', () => {
    it('空列表返回空数组', async () => {
      const res = await request(app).get('/api/passwords').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.entries).toEqual([]);
    });

    it('不返回加密密码字段', async () => {
      await createEntry({ id: 'pw-list-01' });
      const res = await request(app).get('/api/passwords').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.entries[0].encrypted_password).toBeUndefined();
    });

    it('按 category 过滤', async () => {
      await createEntry({ id: 'pw-cat-work', title: '工作密码', category: 'work' });
      await createEntry({ id: 'pw-cat-life', title: '生活密码', category: 'life' });

      const res = await request(app).get('/api/passwords?category=work').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.entries.length).toBe(1);
      expect(res.body.data.entries[0].title).toBe('工作密码');
    });

    it('无 token 返回 401', async () => {
      const res = await request(app).get('/api/passwords');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/passwords', () => {
    it('缺少密码返回 400', async () => {
      const res = await request(app)
        .post('/api/passwords')
        .set(auth())
        .send({ title: '无密码条目' });
      expect(res.status).toBe(400);
    });

    it('成功创建密码条目', async () => {
      const res = await request(app)
        .post('/api/passwords')
        .set(auth())
        .send({ title: 'GitHub', url: 'https://github.com', username: 'me', password: 'gh_pass', notes: '我的账号', category: 'dev' });
      expect(res.status).toBe(201);
      expect(res.body.data.entry.title).toBe('GitHub');
      expect(res.body.data.entry.encrypted_password).toBeUndefined();
    });

    it('无 title 也可创建', async () => {
      const res = await request(app)
        .post('/api/passwords')
        .set(auth())
        .send({ password: 'justapassword' });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/passwords/:id', () => {
    it('不存在的条目返回 404', async () => {
      const res = await request(app).get('/api/passwords/nonexistent').set(auth());
      expect(res.status).toBe(404);
    });

    it('获取已创建的条目', async () => {
      await createEntry({ id: 'pw-get-01', title: '我的密码' });
      const res = await request(app).get('/api/passwords/pw-get-01').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.entry.title).toBe('我的密码');
    });
  });

  describe('GET /api/passwords/:id/decrypt', () => {
    it('不存在的条目返回 404', async () => {
      const res = await request(app).get('/api/passwords/nonexistent/decrypt').set(auth());
      expect(res.status).toBe(404);
    });

    it('成功解密返回明文密码', async () => {
      await createEntry({ id: 'pw-dec-01', password: 'mySecretPass!' });
      const res = await request(app).get('/api/passwords/pw-dec-01/decrypt').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.password).toBe('mySecretPass!');
    });
  });

  describe('PUT /api/passwords/:id', () => {
    it('不存在的条目返回 404', async () => {
      const res = await request(app)
        .put('/api/passwords/nonexistent')
        .set(auth())
        .send({ title: '新标题' });
      expect(res.status).toBe(404);
    });

    it('更新标题和 URL', async () => {
      await createEntry({ id: 'pw-put-01', title: '旧标题' });
      const res = await request(app)
        .put('/api/passwords/pw-put-01')
        .set(auth())
        .send({ title: '新标题', url: 'https://example.com' });
      expect(res.status).toBe(200);
      expect(res.body.data.entry.title).toBe('新标题');
    });

    it('更新密码重新加密', async () => {
      await createEntry({ id: 'pw-put-pw', password: 'oldpass' });
      const res = await request(app)
        .put('/api/passwords/pw-put-pw')
        .set(auth())
        .send({ password: 'newpass' });
      expect(res.status).toBe(200);

      // 验证新密码可解密
      const decRes = await request(app).get('/api/passwords/pw-put-pw/decrypt').set(auth());
      expect(decRes.body.data.password).toBe('newpass');
    });
  });

  describe('PATCH /api/passwords/:id/settings', () => {
    it('缺少参数返回 400', async () => {
      const res = await request(app)
        .patch('/api/passwords/test-id/settings')
        .set(auth())
        .send({});
      expect(res.status).toBe(400);
    });

    it('不存在的条目返回 404', async () => {
      const res = await request(app)
        .patch('/api/passwords/nonexistent/settings')
        .set(auth())
        .send({ include_in_search: true });
      expect(res.status).toBe(404);
    });

    it('成功更新搜索开关', async () => {
      await createEntry({ id: 'pw-settings-01' });
      const res = await request(app)
        .patch('/api/passwords/pw-settings-01/settings')
        .set(auth())
        .send({ include_in_search: true });
      expect(res.status).toBe(200);
      expect(res.body.data.include_in_search).toBe(true);
    });
  });

  describe('DELETE /api/passwords/:id', () => {
    it('不存在的条目返回 404', async () => {
      const res = await request(app).delete('/api/passwords/nonexistent').set(auth());
      expect(res.status).toBe(404);
    });

    it('成功删除条目', async () => {
      await createEntry({ id: 'pw-del-01' });
      const res = await request(app).delete('/api/passwords/pw-del-01').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('已删除');

      // 确认已删除
      const getRes = await request(app).get('/api/passwords/pw-del-01').set(auth());
      expect(getRes.status).toBe(404);
    });
  });
});
