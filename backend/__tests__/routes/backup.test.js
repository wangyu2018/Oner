// Mock rate limiters before any imports
vi.mock('../../src/middleware/rateLimiter.js', () => ({
  loginLimiter: (req, res, next) => next(),
  registerLimiter: (req, res, next) => next(),
  pinVerifyLimiter: (req, res, next) => next(),
  notesWriteLimiter: (req, res, next) => next(),
  backupLimiter: (req, res, next) => next(),
  uploadsLimiter: (req, res, next) => next(),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Backup Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: backupRouter } = await import('../../src/routes/backup.js');
    app.use('/api/backup', backupRouter);

    const result = await createTestUser({ username: 'bkpuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  describe('GET /api/backup/export', () => {
    it('BA-01: 导出空笔记返回 ZIP', async () => {
      const res = await request(app).get('/api/backup/export').set(auth());
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/zip');
      expect(res.headers['content-disposition']).toContain('oner-backup');
    });
  });

  describe('GET /api/backup/download-db', () => {
    it('BA-02: 数据库下载端点已禁用', async () => {
      const res = await request(app).get('/api/backup/download-db').set(auth());
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('禁用');
    });
  });
});
