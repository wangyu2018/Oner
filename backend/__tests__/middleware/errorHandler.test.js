import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('errorHandler', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  it('EH-01: 普通 Error 对象返回 500', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.js');
    app.get('/test', (req, res, next) => next(new Error('Something broke')));
    app.use(errorHandler);

    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('服务器内部错误，请稍后重试');
    expect(res.body.code).toBe(500);
  });

  it('EH-02: 带 statusCode 的 Error 正确传递', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.js');
    app.get('/test', (req, res, next) => {
      const err = new Error('Custom error');
      err.statusCode = 422;
      next(err);
    });
    app.use(errorHandler);

    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Custom error');
    expect(res.body.code).toBe(422);
  });

  it('EH-03: 自定义 400 错误', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.js');
    app.get('/test', (req, res, next) => {
      const err = new Error('输入不合法');
      err.statusCode = 400;
      next(err);
    });
    app.use(errorHandler);

    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('输入不合法');
  });
});
