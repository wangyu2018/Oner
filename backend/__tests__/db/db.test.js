import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb, getDb } from '../../src/db/index.js';
import { migrate } from '../../src/db/migrate.js';

describe('Database Layer', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    initDb();
  });

  afterAll(() => {
    closeDb();
  });

  it('DB-01: 迁移后所有表已创建', () => {
    migrate();
    const db = getDb();
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_fts'"
    ).all();
    const tableNames = tables.map(t => t.name).sort();

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('notes');
    expect(tableNames).toContain('categories');
    expect(tableNames).toContain('password_entries');
    expect(tableNames).toContain('file_attachments');
    expect(tableNames).toContain('user_settings');
    expect(tableNames).toContain('ai_conversations');
    expect(tableNames).toContain('wechat_subscriptions');
  });

  it('DB-02: 迁移幂等性（重复迁移不报错）', () => {
    expect(() => migrate()).not.toThrow();
  });

  it('DB-03: WAL 模式已启用', () => {
    const db = getDb();
    const row = db.prepare('PRAGMA journal_mode').get();
    expect(row.journal_mode.toLowerCase()).toBe('wal');
  });

  it('DB-04: 外键约束已启用', () => {
    const db = getDb();
    const row = db.prepare('PRAGMA foreign_keys').get();
    expect(row.foreign_keys).toBe(1);
  });

  it('DB-05: FTS5 虚拟表已创建', () => {
    const db = getDb();
    const ftsTable = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='notes_fts'"
    ).get();
    expect(ftsTable).toBeTruthy();
    expect(ftsTable.name).toBe('notes_fts');
  });

  it('DB-06: 外键约束生效（插入不存在的 user_id 失败）', () => {
    const db = getDb();
    expect(() => {
      db.prepare(
        "INSERT INTO sessions (id, user_id, token, expires_at) VALUES ('s1', 'nonexistent', 'token', '2025-01-01')"
      ).run();
    }).toThrow();
  });

  it('DB-07: 正常插入和查询数据', () => {
    const db = getDb();
    db.prepare(
      "INSERT INTO users (id, username, email, password) VALUES ('db-test-1', 'dbuser', 'db@test.com', 'hashed')"
    ).run();

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get('db-test-1');
    expect(user).toBeTruthy();
    expect(user.username).toBe('dbuser');
    expect(user.email).toBe('db@test.com');

    // 清理
    db.prepare("DELETE FROM users WHERE id = ?").run('db-test-1');
  });
});
