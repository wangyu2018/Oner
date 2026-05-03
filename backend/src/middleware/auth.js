import jwt from 'jsonwebtoken';
import { getDb } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'oner-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

export function generateToken(userId, device = '') {
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

  // 检查 session 是否存在且未过期
  const db = getDb();
  const stmt = db.prepare(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
  );
  stmt.bind([token]);

  let session = null;
  if (stmt.step()) {
    session = stmt.getAsObject();
  }
  stmt.free();

  if (!session) {
    return res.status(401).json({
      success: false,
      error: '会话已失效，请重新登录',
      code: 401
    });
  }

  // 获取用户信息
  const userStmt = db.prepare('SELECT id, username, email, avatar FROM users WHERE id = ?');
  userStmt.bind([decoded.userId]);

  let user = null;
  if (userStmt.step()) {
    user = userStmt.getAsObject();
  }
  userStmt.free();

  if (!user) {
    return res.status(401).json({
      success: false,
      error: '用户不存在',
      code: 401
    });
  }

  req.user = user;
  req.session = session;
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

  const db = getDb();
  const userStmt = db.prepare('SELECT id, username, email, avatar FROM users WHERE id = ?');
  userStmt.bind([decoded.userId]);

  let user = null;
  if (userStmt.step()) {
    user = userStmt.getAsObject();
  }
  userStmt.free();

  req.user = user;
  next();
}
