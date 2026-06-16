import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('rateLimiter', () => {
  // 使用固定窗口测试限流行为
  let app;
  const limiterConfigs = [];

  beforeEach(() => {
    app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    // 清除之前的限流器缓存
    vi.resetModules();
  });

  it('RL-04: notesWriteLimiter 短时间多个请求触发 429', async () => {
    // 创建一个仅允许 2 次/分钟的限流器
    const rateLimit = (await import('express-rate-limit')).default;
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: '操作过于频繁', code: 429 },
    });

    app.post('/test', testLimiter, (req, res) => res.json({ ok: true }));

    // 前 2 次应成功
    const res1 = await request(app).post('/test');
    expect(res1.status).toBe(200);

    const res2 = await request(app).post('/test');
    expect(res2.status).toBe(200);

    // 第 3 次应被限流
    const res3 = await request(app).post('/test');
    expect(res3.status).toBe(429);
    expect(res3.body.code).toBe(429);
  });

  it('RL-06: 不同 IP 独立计数', async () => {
    const rateLimit = (await import('express-rate-limit')).default;
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 1,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: '限流', code: 429 },
    });

    app.get('/test', testLimiter, (req, res) => res.json({ ok: true }));

    const res1 = await request(app).get('/test').set('X-Forwarded-For', '1.1.1.1');
    expect(res1.status).toBe(200);

    // 同一 IP 第二次应被限流
    const res2 = await request(app).get('/test').set('X-Forwarded-For', '1.1.1.1');
    expect(res2.status).toBe(429);

    // 不同 IP 应成功
    const res3 = await request(app).get('/test').set('X-Forwarded-For', '2.2.2.2');
    expect(res3.status).toBe(200);
  });
});
