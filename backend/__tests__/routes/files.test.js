// Mock rate limiters before any imports
vi.mock('../../src/middleware/rateLimiter.js', () => ({
  uploadsLimiter: (req, res, next) => next(),
  backupLimiter: (req, res, next) => next(),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('Files Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    process.env.UPLOAD_DIR = path.resolve(import.meta.dirname, '..', 'test-uploads');
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: filesRouter } = await import('../../src/routes/files.js');
    app.use('/api/files', filesRouter);

    const result = await createTestUser({ username: 'fileuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
    // 清理测试上传目录
    const uploadDir = path.resolve(import.meta.dirname, '..', 'test-uploads');
    try {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    } catch {}
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  describe('POST /api/files/upload', () => {
    it('FI-01: 不上传文件返回 400', async () => {
      const res = await request(app)
        .post('/api/files/upload')
        .set(auth());
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('请选择');
    });

    it('FI-02: 上传文本文件成功返回 201', async () => {
      const res = await request(app)
        .post('/api/files/upload')
        .set(auth())
        .attach('file', Buffer.from('Hello World'), 'test.txt');
      expect(res.status).toBe(201);
      expect(res.body.data.attachment).toBeDefined();
      expect(res.body.data.attachment.original_name).toBe('test.txt');
      expect(res.body.data.attachment.mime_type).toBe('text/plain');
    });

    it('FI-03: 上传图片文件成功', async () => {
      const res = await request(app)
        .post('/api/files/upload')
        .set(auth())
        .attach('file', Buffer.from('fake-png'), 'photo.png');
      expect(res.status).toBe(201);
      expect(res.body.data.attachment.mime_type).toBe('image/png');
    });
  });

  describe('GET /api/files', () => {
    it('FI-04: 空文件列表', async () => {
      const res = await request(app).get('/api/files').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.files).toEqual([]);
    });
  });

  describe('GET /api/files/:id/download', () => {
    it('FI-05: 不存在的文件返回 404', async () => {
      const res = await request(app).get('/api/files/nonexistent/download').set(auth());
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('不存在');
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('FI-06: 删除不存在的文件返回 404', async () => {
      const res = await request(app).delete('/api/files/nonexistent').set(auth());
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('不存在');
    });
  });
});
