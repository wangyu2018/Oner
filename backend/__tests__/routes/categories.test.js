import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Categories Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: categoriesRouter } = await import('../../src/routes/categories.js');
    app.use('/api/categories', categoriesRouter);

    const result = await createTestUser({ username: 'catuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  describe('GET /api/categories', () => {
    it('CA-01: 空列表返回 []', async () => {
      const res = await request(app).get('/api/categories').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories).toEqual([]);
    });

    it('CA-02: 返回用户分类列表（含多分类）', async () => {
      // 直接插入分类
      const { runQuery } = await import('../../src/db/helpers.js');
      runQuery("INSERT INTO categories (id, user_id, name, color, position) VALUES ('c1', ?, '工作', '#ef4444', 0)", [testUser.id]);
      runQuery("INSERT INTO categories (id, user_id, name, color, position) VALUES ('c2', ?, '学习', '#3b82f6', 1)", [testUser.id]);
      runQuery("INSERT INTO categories (id, user_id, name, color, position) VALUES ('c3', ?, '生活', '#10b981', 2)", [testUser.id]);

      const res = await request(app).get('/api/categories').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.categories).toHaveLength(3);
      expect(res.body.data.categories[0].name).toBe('工作');
    });
  });

  describe('POST /api/categories', () => {
    it('CA-03: 名称为空返回 400', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set(auth())
        .send({ name: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('不能为空');
    });

    it('CA-04: 创建成功返回 201', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set(auth())
        .send({ name: '工作', color: '#ef4444' });
      expect(res.status).toBe(201);
      expect(res.body.data.category.name).toBe('工作');
      expect(res.body.data.category.color).toBe('#ef4444');
    });

    it('CA-05: 颜色值格式无效返回 400', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set(auth())
        .send({ name: '测试分类', color: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('颜色');
    });

    it('CA-06: 名称超过30字符返回 400', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set(auth())
        .send({ name: 'a'.repeat(31) });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('30');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('CA-07: 更新不存在的分类返回 404', async () => {
      const res = await request(app)
        .put('/api/categories/nonexistent')
        .set(auth())
        .send({ name: '新名称' });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('不存在');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('CA-08: 删除分类成功并清空笔记分类', async () => {
      const { runQuery, queryOne } = await import('../../src/db/helpers.js');
      runQuery("INSERT INTO categories (id, user_id, name, color) VALUES ('c-del', ?, '待删除', '#ff0000')", [testUser.id]);
      runQuery("INSERT INTO notes (id, user_id, title, content, category) VALUES ('n1', ?, 'test', 'content', '待删除')", [testUser.id]);

      const res = await request(app).delete('/api/categories/c-del').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      // 验证笔记分类已被清空
      const note = queryOne('SELECT category FROM notes WHERE id = ?', ['n1']);
      expect(note.category).toBe('');
    });
  });
});
