import rateLimit from 'express-rate-limit';

// 全局限制：每分钟 100 次请求
export const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试', code: 429 }
});

// 登录端点专用限制：每分钟 10 次尝试
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过于频繁，请稍后再试', code: 429 }
});

// 注册端点专用限制：每小时 5 次
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '注册尝试过于频繁，请稍后再试', code: 429 }
});

// 笔记写操作限制：每分钟 30 次
export const notesWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '操作过于频繁，请稍后再试', code: 429 }
});

// 备份下载限制：每小时 3 次
export const backupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '备份下载过于频繁，请稍后再试', code: 429 }
});
