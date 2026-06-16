import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Search Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: searchRouter } = await import('../../src/routes/search.js');
    app.use('/api/search', searchRouter);

    const result = await createTestUser({ username: 'searchuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  describe('GET /api/search', () => {
    it('SE-01: 空关键词返回空结果', async () => {
      const res = await request(app).get('/api/search').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.results).toEqual([]);
    });

    it('SE-02: 搜索笔记返回匹配结果', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      runQuery("INSERT INTO notes (id, user_id, title, content, status) VALUES ('n1', ?, '项目计划', '这是一个关于项目的笔记', 'note')", [testUser.id]);
      runQuery("INSERT INTO notes (id, user_id, title, content, status) VALUES ('n2', ?, '购物清单', '超市购物清单', 'note')", [testUser.id]);

      const res = await request(app).get('/api/search?q=项目').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0].title).toBe('项目计划');
    });

    it('SE-03: 中文关键词搜索', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      runQuery("INSERT INTO notes (id, user_id, title, content, status) VALUES ('n1', ?, '测试中文', '中文内容测试', 'note')", [testUser.id]);
      runQuery("INSERT INTO notes (id, user_id, title, content, status) VALUES ('n2', ?, 'English Note', 'Some English content', 'note')", [testUser.id]);

      const res = await request(app).get('/api/search?q=中文').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.results.length).toBeGreaterThan(0);
    });

    it('SE-04: 搜索包含密码条目', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      runQuery("INSERT INTO notes (id, user_id, title, content, status) VALUES ('n1', ?, '我的笔记', '内容', 'note')", [testUser.id]);
      runQuery("INSERT INTO password_entries (id, user_id, title, url, username, encrypted_password, include_in_search) VALUES ('p1', ?, 'GitHub', 'https://github.com', 'user', 'encrypted', 1)", [testUser.id]);

      const res = await request(app).get('/api/search?q=GitHub&include_passwords=true').set(auth());
      expect(res.status).toBe(200);
      const titles = res.body.data.results.map(r => r.title);
      expect(titles).toContain('GitHub');
    });

    it('SE-05: 特殊字符搜索不报错', async () => {
      const res = await request(app).get('/api/search?q=%22%27%3C%3E').set(auth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.results)).toBe(true);
    });
  });
});
