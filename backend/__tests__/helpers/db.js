import { initDb, closeDb, getDb } from '../../src/db/index.js';
import { migrate } from '../../src/db/migrate.js';
import { hashPassword } from '../../src/utils/crypto.js';

/** 初始化测试数据库并运行迁移 */
export function setupTestDb() {
  initDb();
  migrate();
  // 清理所有表数据，确保测试隔离
  const db = getDb();
  db.exec("DELETE FROM sessions");
  db.exec("DELETE FROM ai_conversations");
  db.exec("DELETE FROM wechat_subscriptions");
  db.exec("DELETE FROM file_attachments");
  db.exec("DELETE FROM password_entries");
  db.exec("DELETE FROM user_settings");
  db.exec("DELETE FROM categories");
  db.exec("DELETE FROM notes");
  db.exec("DELETE FROM users");
  return db;
}

/** 清理测试数据库 */
export function teardownTestDb() {
  closeDb();
}

/** 创建测试用户并返回 { user, token } */
export async function createTestUser(overrides = {}) {
  const db = getDb();
  const { queryOne, runQuery } = await import('../../src/db/helpers.js');
  const { generateToken } = await import('../../src/middleware/auth.js');

  const id = overrides.id || 'test-user-id-0001';
  const username = overrides.username || 'testuser';
  const hashedPw = await hashPassword(overrides.password || 'testpass123');

  runQuery(
    'INSERT OR REPLACE INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
    [id, username, overrides.email || 'test@test.com', hashedPw]
  );

  const token = generateToken(id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  runQuery(
    'INSERT OR REPLACE INTO sessions (id, user_id, device, token, expires_at) VALUES (?, ?, ?, ?, ?)',
    [`session-${id}`, id, 'test', token, expiresAt]
  );

  return { user: { id, username }, token };
}

/** 生成带 Bearer 的请求头 */
export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
