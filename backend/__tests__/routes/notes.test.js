// Mock rate limiters before any imports
vi.mock('../../src/middleware/rateLimiter.js', () => ({
  notesWriteLimiter: (req, res, next) => next(),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Notes Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: notesRouter } = await import('../../src/routes/notes.js');
    app.use('/api/notes', notesRouter);

    const result = await createTestUser({ username: 'notesuser', password: 'testpass123' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  async function createNote(overrides = {}) {
    const { runQuery, queryOne } = await import('../../src/db/helpers.js');
    const crypto = await import('crypto');
    const id = overrides.id || crypto.default.randomUUID().replace(/-/g, '').slice(0, 16);
    const note = {
      id,
      user_id: testUser.id,
      title: overrides.title || '测试笔记',
      content: overrides.content || '这是测试内容',
      tags: JSON.stringify(overrides.tags || ['test']),
      status: overrides.status || 'note',
      priority: overrides.priority || 'normal',
      due_date: overrides.due_date || null,
      completed_at: overrides.completed_at || null,
      deleted_at: null,
      version: 1,
      position: overrides.position || 0,
      parent_id: overrides.parent_id || null,
      recurrence: overrides.recurrence || '',
      category: overrides.category || '',
    };
    runQuery(
      `INSERT INTO notes (id, user_id, title, content, tags, status, priority, due_date, completed_at, deleted_at, version, position, parent_id, recurrence, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [note.id, note.user_id, note.title, note.content, note.tags, note.status, note.priority,
       note.due_date, note.completed_at, note.deleted_at, note.version, note.position,
       note.parent_id, note.recurrence, note.category]
    );
    return note;
  }

  describe('GET /api/notes', () => {
    it('空列表返回空数组', async () => {
      const res = await request(app).get('/api/notes').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.notes).toEqual([]);
      expect(res.body.data.hasMore).toBe(false);
    });

    it('返回已创建的笔记列表', async () => {
      await createNote({ title: '笔记A' });
      await createNote({ title: '笔记B', id: 'note-id-0002' });

      const res = await request(app).get('/api/notes').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.notes.length).toBe(2);
    });

    it('按 tag 过滤', async () => {
      await createNote({ title: '带标签', tags: ['urgent'] });
      await createNote({ title: '无标签', tags: ['other'], id: 'note-id-0003' });

      const res = await request(app).get('/api/notes?tag=urgent').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.notes.length).toBe(1);
      expect(res.body.data.notes[0].title).toBe('带标签');
    });

    it('按 status 过滤', async () => {
      await createNote({ title: '待办', status: 'todo' });
      await createNote({ title: '完成', status: 'done', id: 'note-id-0004' });

      const res = await request(app).get('/api/notes?status=todo').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.notes.length).toBe(1);
      expect(res.body.data.notes[0].status).toBe('todo');
    });

    it('按 priority 过滤', async () => {
      await createNote({ title: '紧急', priority: 'urgent' });
      await createNote({ title: '普通', priority: 'normal', id: 'note-id-0005' });

      const res = await request(app).get('/api/notes?priority=urgent').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.notes.length).toBe(1);
      expect(res.body.data.notes[0].priority).toBe('urgent');
    });

    it('按 category 过滤', async () => {
      await createNote({ title: '工作', category: 'work' });
      await createNote({ title: '生活', category: 'life', id: 'note-id-0006' });

      const res = await request(app).get('/api/notes?category=work').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.notes.length).toBe(1);
      expect(res.body.data.notes[0].category).toBe('work');
    });

    it('支持分页 cursor', async () => {
      const n1 = await createNote({ title: '笔记1', id: 'note-1000001', position: 10 });
      const n2 = await createNote({ title: '笔记2', id: 'note-1000002', position: 20 });
      const n3 = await createNote({ title: '笔记3', id: 'note-1000003', position: 30 });

      const res = await request(app).get(`/api/notes?cursor=${n2.id}&limit=1`).set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.notes.length).toBeLessThanOrEqual(1);
    });

    it('limit 参数控制返回数量', async () => {
      for (let i = 0; i < 5; i++) {
        await createNote({ title: `笔记${i}`, id: `note-limit-${i}`, position: i * 10 });
      }
      const res = await request(app).get('/api/notes?limit=2').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.notes.length).toBe(2);
      expect(res.body.data.hasMore).toBe(true);
    });

    it('软删除的笔记不在列表中', async () => {
      const createRes = await request(app)
        .post('/api/notes')
        .set(auth())
        .send({ title: '待删除笔记', content: '稍后删除' });
      const noteId = createRes.body.data.note.id;

      await request(app)
        .delete(`/api/notes/${noteId}`)
        .set(auth());

      const res = await request(app).get('/api/notes').set(auth());
      expect(res.body.data.notes.find(n => n.id === noteId)).toBeUndefined();
    });
  });

  describe('POST /api/notes', () => {
    it('创建笔记成功', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(auth())
        .send({ title: '新笔记', content: '新内容', tags: ['work'] });
      expect(res.status).toBe(201);
      expect(res.body.data.note.title).toBe('新笔记');
      expect(res.body.data.note.tags).toContain('work');
    });

    it('标题超过200字符返回 400', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(auth())
        .send({ title: 'x'.repeat(201), content: '内容' });
      expect(res.status).toBe(400);
    });

    it('内容超过100000字符返回 400', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(auth())
        .send({ title: '标题', content: 'x'.repeat(100001) });
      expect(res.status).toBe(400);
    });

    it('从内容自动提取标签', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(auth())
        .send({ title: '标签笔记', content: '关于 #react 和 #nodejs 的开发笔记' });
      expect(res.status).toBe(201);
      expect(res.body.data.note.tags).toContain('react');
      expect(res.body.data.note.tags).toContain('nodejs');
    });

    it('父笔记不存在返回 400', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(auth())
        .send({ title: '子任务', content: '内容', parent_id: 'nonexistent' });
      expect(res.status).toBe(400);
    });

    it('父笔记存在时创建子任务成功', async () => {
      const parent = await createNote({ title: '父任务', id: 'parent-note-01' });
      const res = await request(app)
        .post('/api/notes')
        .set(auth())
        .send({ title: '子任务', content: '内容', parent_id: parent.id });
      expect(res.status).toBe(201);
      expect(res.body.data.note.parent_id).toBe(parent.id);
    });

    it('status=done 时自动设置 completed_at', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(auth())
        .send({ title: '已完成', content: '内容', status: 'done' });
      expect(res.status).toBe(201);
      expect(res.body.data.note.completed_at).not.toBeNull();
    });
  });

  describe('POST /api/notes/batch', () => {
    it('ids 为空数组返回 400', async () => {
      const res = await request(app)
        .post('/api/notes/batch')
        .set(auth())
        .send({ ids: [], action: 'delete' });
      expect(res.status).toBe(400);
    });

    it('无效的 action 返回 400', async () => {
      const res = await request(app)
        .post('/api/notes/batch')
        .set(auth())
        .send({ ids: ['note-1'], action: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('批量删除笔记', async () => {
      const n1 = await createNote({ title: '待删1', id: 'batch-del-01' });
      const n2 = await createNote({ title: '待删2', id: 'batch-del-02' });

      const res = await request(app)
        .post('/api/notes/batch')
        .set(auth())
        .send({ ids: [n1.id, n2.id], action: 'delete' });
      expect(res.status).toBe(200);
      expect(res.body.data.affected).toBe(2);
    });

    it('批量更新状态', async () => {
      const n1 = await createNote({ title: '状态1', id: 'batch-st-01', status: 'todo' });
      const n2 = await createNote({ title: '状态2', id: 'batch-st-02', status: 'todo' });

      const res = await request(app)
        .post('/api/notes/batch')
        .set(auth())
        .send({ ids: [n1.id, n2.id], action: 'update_status', status: 'done' });
      expect(res.status).toBe(200);
      expect(res.body.data.affected).toBe(2);
    });

    it('批量更新优先级', async () => {
      const n1 = await createNote({ title: '优先级1', id: 'batch-pr-01', priority: 'low' });

      const res = await request(app)
        .post('/api/notes/batch')
        .set(auth())
        .send({ ids: [n1.id], action: 'update_priority', priority: 'high' });
      expect(res.status).toBe(200);
      expect(res.body.data.affected).toBe(1);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('获取不存在的笔记返回 404', async () => {
      const res = await request(app).get('/api/notes/nonexistent').set(auth());
      expect(res.status).toBe(404);
    });

    it('获取已创建的笔记', async () => {
      const note = await createNote({ title: '特定笔记', id: 'note-get-0001' });
      const res = await request(app).get(`/api/notes/${note.id}`).set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.note.title).toBe('特定笔记');
    });
  });

  describe('GET /api/notes/:id/subtasks', () => {
    it('父笔记不存在返回 404', async () => {
      const res = await request(app).get('/api/notes/nonexistent/subtasks').set(auth());
      expect(res.status).toBe(404);
    });

    it('返回子任务列表和进度', async () => {
      const parent = await createNote({ title: '父任务', id: 'sub-parent-01' });
      await createNote({ title: '子任务1', id: 'sub-child-01', status: 'done', parent_id: parent.id });
      await createNote({ title: '子任务2', id: 'sub-child-02', parent_id: parent.id });

      const res = await request(app).get(`/api/notes/${parent.id}/subtasks`).set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.subtasks.length).toBe(2);
      expect(res.body.data.progress.total).toBe(2);
      expect(res.body.data.progress.done).toBe(1);
    });
  });

  describe('POST /api/notes/:id/subtasks', () => {
    it('父笔记不存在返回 404', async () => {
      const res = await request(app)
        .post('/api/notes/nonexistent/subtasks')
        .set(auth())
        .send({ title: '子任务' });
      expect(res.status).toBe(404);
    });

    it('子任务标题为空返回 400', async () => {
      const parent = await createNote({ title: '父', id: 'sub-cr-parent' });
      const res = await request(app)
        .post(`/api/notes/${parent.id}/subtasks`)
        .set(auth())
        .send({ title: '' });
      expect(res.status).toBe(400);
    });

    it('成功创建子任务', async () => {
      const parent = await createNote({ title: '父任务', id: 'sub-cr-ok' });
      const res = await request(app)
        .post(`/api/notes/${parent.id}/subtasks`)
        .set(auth())
        .send({ title: '新子任务', content: '子任务内容' });
      expect(res.status).toBe(201);
      expect(res.body.data.subtask.title).toBe('新子任务');
      expect(res.body.data.subtask.parent_id).toBe(parent.id);
      expect(res.body.data.subtask.status).toBe('todo');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('更新笔记标题', async () => {
      const note = await createNote({ id: 'put-title-01' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set(auth())
        .send({ title: '更新后的标题' });
      expect(res.status).toBe(200);
      expect(res.body.data.note.title).toBe('更新后的标题');
    });

    it('不存在的笔记返回 404', async () => {
      const res = await request(app)
        .put('/api/notes/nonexistent')
        .set(auth())
        .send({ title: '新标题' });
      expect(res.status).toBe(404);
    });

    it('版本冲突返回 409', async () => {
      const note = await createNote({ id: 'put-conflict' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set(auth())
        .send({ title: '新标题', version: 999 });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe(409);
      expect(res.body.data.serverVersion).toBe(1);
    });

    it('更新标签', async () => {
      const note = await createNote({ id: 'put-tags-01', tags: ['old'] });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set(auth())
        .send({ tags: ['new', 'updated'] });
      expect(res.status).toBe(200);
      expect(res.body.data.note.tags).toContain('new');
      expect(res.body.data.note.tags).toContain('updated');
    });

    it('更新状态自动清除/设置 completed_at', async () => {
      const note = await createNote({ id: 'put-status-done', status: 'todo' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set(auth())
        .send({ status: 'done' });
      expect(res.status).toBe(200);
      expect(res.body.data.note.completed_at).not.toBeNull();
      expect(res.body.data.note.status).toBe('done');
    });

    it('重复任务完成时自动创建下一周期', async () => {
      const note = await createNote({
        id: 'put-recur-01',
        status: 'todo',
        due_date: '2024-01-01',
        recurrence: 'daily',
      });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set(auth())
        .send({ status: 'done' });
      expect(res.status).toBe(200);

      // 应该自动创建了新任务
      const { queryOne } = await import('../../src/db/helpers.js');
      const child = queryOne("SELECT * FROM notes WHERE title = '测试笔记' AND id != ?", [note.id]);
      expect(child).not.toBeNull();
      expect(child.status).toBe('todo');
      expect(child.due_date).toBe('2024-01-02');
    });

    it('标题超过200字符返回 400', async () => {
      const note = await createNote({ id: 'put-long-title' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set(auth())
        .send({ title: 'x'.repeat(201) });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('不存在的笔记返回 404', async () => {
      const res = await request(app).delete('/api/notes/nonexistent').set(auth());
      expect(res.status).toBe(404);
    });

    it('成功软删除笔记', async () => {
      const note = await createNote({ id: 'del-soft-01' });
      const res = await request(app).delete(`/api/notes/${note.id}`).set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      // 确认不再出现在列表中
      const listRes = await request(app).get('/api/notes').set(auth());
      expect(listRes.body.data.notes.find(n => n.id === note.id)).toBeUndefined();
    });

    it('删除笔记同时软删除子任务', async () => {
      const parent = await createNote({ id: 'del-cascade-p' });
      await createNote({ id: 'del-cascade-c', parent_id: parent.id });
      await request(app).delete(`/api/notes/${parent.id}`).set(auth());

      const { queryOne } = await import('../../src/db/helpers.js');
      const child = queryOne('SELECT * FROM notes WHERE id = ?', ['del-cascade-c']);
      expect(child.deleted_at).not.toBeNull();
    });
  });
});
