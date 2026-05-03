import { Router } from 'express';
import { getDb, saveDb } from '../db/index.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// 辅助函数
function queryAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function runQuery(sql, params = []) {
  const db = getDb();
  db.run(sql, params);
  saveDb();
}

// 生成随机 ID
function generateId() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// POST /api/auth/register - 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码必填',
        code: 400
      });
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        error: '用户名长度需在 3-20 个字符之间',
        code: 400
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码长度至少 6 个字符',
        code: 400
      });
    }

    // 检查用户名是否已存在
    const existingUser = queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '用户名已存在',
        code: 400
      });
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = queryOne('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: '邮箱已被注册',
          code: 400
        });
      }
    }

    // 创建用户
    const id = generateId();
    const hashedPassword = await hashPassword(password);

    runQuery(
      'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
      [id, username, email || null, hashedPassword]
    );

    // 生成 Token
    const device = req.headers['user-agent'] || '';
    const token = generateToken(id, device);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 创建 Session
    const sessionId = generateId();
    runQuery(
      'INSERT INTO sessions (id, user_id, device, ip, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, id, device, req.ip, token, expiresAt]
    );

    // 返回用户信息
    const user = queryOne('SELECT id, username, email, avatar FROM users WHERE id = ?', [id]);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
      code: 500
    });
  }
});

// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码必填',
        code: 400
      });
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = queryOne(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误',
        code: 401
      });
    }

    // 验证密码
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误',
        code: 401
      });
    }

    // 检查设备数量限制（最多 5 个）
    const sessions = queryAll(
      'SELECT * FROM sessions WHERE user_id = ? AND expires_at > datetime(\'now\')',
      [user.id]
    );

    if (sessions.length >= 5) {
      // 删除最早的 session
      const oldestSession = sessions[0];
      runQuery('DELETE FROM sessions WHERE id = ?', [oldestSession.id]);
    }

    // 生成 Token
    const device = req.headers['user-agent'] || '';
    const token = generateToken(user.id, device);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 创建 Session
    const sessionId = generateId();
    runQuery(
      'INSERT INTO sessions (id, user_id, device, ip, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, user.id, device, req.ip, token, expiresAt]
    );

    // 返回用户信息
    const { password: _, ...userInfo } = user;

    res.json({
      success: true,
      data: {
        user: userInfo,
        token
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
      code: 500
    });
  }
});

// POST /api/auth/logout - 注销当前设备
router.post('/logout', authMiddleware, (req, res) => {
  try {
    const token = req.headers.authorization.substring(7);
    runQuery('DELETE FROM sessions WHERE token = ?', [token]);

    res.json({
      success: true,
      data: { message: '已注销' }
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: '注销失败',
      code: 500
    });
  }
});

// GET /api/auth/me - 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

// GET /api/auth/sessions - 获取所有登录设备
router.get('/sessions', authMiddleware, (req, res) => {
  try {
    const sessions = queryAll(
      "SELECT id, device, ip, created_at, expires_at FROM sessions WHERE user_id = ? AND expires_at > datetime('now') ORDER BY created_at DESC",
      [req.user.id]
    );

    // 标记当前设备
    const currentToken = req.headers.authorization.substring(7);
    const currentSession = queryOne('SELECT id FROM sessions WHERE token = ?', [currentToken]);

    const sessionsWithCurrent = sessions.map(s => ({
      ...s,
      isCurrent: s.id === currentSession?.id
    }));

    res.json({
      success: true,
      data: { sessions: sessionsWithCurrent }
    });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({
      success: false,
      error: '获取设备列表失败',
      code: 500
    });
  }
});

// DELETE /api/auth/sessions/:id - 踢出指定设备
router.delete('/sessions/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // 检查 session 是否属于当前用户
    const session = queryOne(
      'SELECT * FROM sessions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: '设备不存在',
        code: 404
      });
    }

    // 不能踢出当前设备
    const currentToken = req.headers.authorization.substring(7);
    if (session.token === currentToken) {
      return res.status(400).json({
        success: false,
        error: '不能踢出当前设备，请使用注销功能',
        code: 400
      });
    }

    runQuery('DELETE FROM sessions WHERE id = ?', [id]);

    res.json({
      success: true,
      data: { message: '已踢出设备' }
    });
  } catch (err) {
    console.error('Delete session error:', err);
    res.status(500).json({
      success: false,
      error: '踢出设备失败',
      code: 500
    });
  }
});

// PUT /api/auth/profile - 更新用户资料
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { email, avatar, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 获取完整用户信息
    const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);

    // 如果要修改密码，需要验证当前密码
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: '请输入当前密码',
          code: 400
        });
      }

      const isValid = await comparePassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: '当前密码错误',
          code: 400
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: '新密码长度至少 6 个字符',
          code: 400
        });
      }

      const hashedPassword = await hashPassword(newPassword);
      runQuery('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [hashedPassword, userId]);
    }

    // 更新邮箱
    if (email !== undefined) {
      if (email && email !== user.email) {
        const existingEmail = queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            error: '邮箱已被其他账号使用',
            code: 400
          });
        }
      }
      runQuery('UPDATE users SET email = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [email || null, userId]);
    }

    // 更新头像
    if (avatar !== undefined) {
      runQuery('UPDATE users SET avatar = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [avatar, userId]);
    }

    // 返回更新后的用户信息
    const updatedUser = queryOne('SELECT id, username, email, avatar FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      data: { user: updatedUser }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      error: '更新资料失败',
      code: 500
    });
  }
});

export default router;
