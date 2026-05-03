import { getDb } from './index.js';

export function migrate() {
  const db = getDb();

  try {
    // 检查 users 表是否存在
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    const usersTableExists = tables[0]?.values?.length > 0;

    if (!usersTableExists) {
      console.log('Creating users and sessions tables...');

      // 创建 users 表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          username    TEXT NOT NULL UNIQUE,
          email       TEXT UNIQUE,
          password    TEXT NOT NULL,
          avatar      TEXT DEFAULT '',
          created_at  TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      // 创建 sessions 表
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id          TEXT PRIMARY KEY,
          user_id     TEXT NOT NULL,
          device      TEXT NOT NULL DEFAULT '',
          ip          TEXT DEFAULT '',
          token       TEXT NOT NULL,
          expires_at  TEXT NOT NULL,
          created_at  TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      console.log('Created users and sessions tables');
    }

    // 检查 notes 表的列
    const columns = db.exec("PRAGMA table_info(notes)");
    const columnNames = columns[0]?.values?.map(row => row[1]) || [];

    if (!columnNames.includes('user_id')) {
      db.run("ALTER TABLE notes ADD COLUMN user_id TEXT");
      console.log('Added user_id column to notes table');
    }

    if (!columnNames.includes('status')) {
      db.run("ALTER TABLE notes ADD COLUMN status TEXT NOT NULL DEFAULT 'note'");
      console.log('Added status column to notes table');
    }

    if (!columnNames.includes('due_date')) {
      db.run("ALTER TABLE notes ADD COLUMN due_date TEXT");
      console.log('Added due_date column to notes table');
    }

    if (!columnNames.includes('priority')) {
      db.run("ALTER TABLE notes ADD COLUMN priority TEXT DEFAULT 'normal'");
      console.log('Added priority column to notes table');
    }

    if (!columnNames.includes('completed_at')) {
      db.run("ALTER TABLE notes ADD COLUMN completed_at TEXT");
      console.log('Added completed_at column to notes table');
    }

    // 创建索引
    db.run("CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)");
    db.run("CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status)");
    db.run("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)");

    console.log('Migration completed successfully');

  } catch (err) {
    console.error('Migration error:', err.message);
  }
}
