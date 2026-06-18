import jwt from 'jsonwebtoken';
import { queryOne } from '../db/helpers.js';

// 无硬编码 fallback：JWT_SECRET 必须在环境变量中设置
// server.js 启动时会验证并阻止使用默认值
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

// ========================================
// Auth 内存缓存（60 秒 TTL）
// 每个请求省 2 次 DB 查询（session + user）
// ========================================
const authCache = new Map(); // token -> { user, session, expiresAt }
const AUTH_CACHE_TTL = 60 * 1000; // 60 秒

/**
 * 清除指定 token 的认证缓存（logout/session 失效时调用）
 */
export function invalidateAuthCache(token) {
  authCache.delete(token);
}

export function generateToken(userId, device = '') {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign(
    { userId, device },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未登录，请先登录',
      code: 401
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Token 已过期，请重新登录',
      code: 401
    });
  }

  // ===== Auth 缓存：命中则跳过 DB 查询 =====
  const cached = authCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    req.user = cached.user;
    req.session = cached.session;
    return next();
  }
  if (cached) authCache.delete(token);

  // 检查 session 是否存在且未过期
  const session = queryOne(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')",
    [token]
  );

  if (!session) {
    return res.status(401).json({
      success: false,
      error: '会话已失效，请重新登录',
      code: 401
    });
  }

  // 获取用户信息
  const user = queryOne(
    'SELECT id, username, email, avatar FROM users WHERE id = ?',
    [decoded.userId]
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      error: '用户不存在',
      code: 401
    });
  }

  req.user = user;
  req.session = session;

  // 写入缓存（60 秒有效）
  authCache.set(token, { user, session, expiresAt: Date.now() + AUTH_CACHE_TTL });

  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    req.user = null;
    return next();
  }

  const user = queryOne(
    'SELECT id, username, email, avatar FROM users WHERE id = ?',
    [decoded.userId]
  );

  req.user = user;
  next();
}
