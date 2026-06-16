import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Reminders Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: remindersRouter } = await import('../../src/routes/reminders.js');
    app.use('/api/reminders', remindersRouter);

    const result = await createTestUser({ username: 'remuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  describe('GET /api/reminders', () => {
    it('RE-01: 无到期提醒时返回空', async () => {
      const res = await request(app).get('/api/reminders').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.overdue).toEqual([]);
      expect(res.body.data.due_today).toEqual([]);
      expect(res.body.data.due_tomorrow).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it('RE-02: 有过期待办时返回提醒', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      runQuery(
        "INSERT INTO notes (id, user_id, title, content, status, due_date) VALUES ('n1', ?, '过期任务', '内容', 'todo', ?)",
        [testUser.id, yesterday]
      );

      const res = await request(app).get('/api/reminders').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.overdue.length).toBeGreaterThan(0);
      expect(res.body.data.overdue[0].title).toBe('过期任务');
      expect(res.body.data.overdue[0].days).toBeGreaterThan(0);
    });

    it('RE-03: 今天到期返回提醒', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      const today = new Date().toISOString().slice(0, 10);
      runQuery(
        "INSERT INTO notes (id, user_id, title, content, status, due_date) VALUES ('n1', ?, '今日任务', '内容', 'in_progress', ?)",
        [testUser.id, today]
      );

      const res = await request(app).get('/api/reminders').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.due_today.length).toBeGreaterThan(0);
    });
  });
});
