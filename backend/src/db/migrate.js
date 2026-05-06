import { getDb } from './index.js';

export function migrate() {
  const db = getDb();

  try {
    // 检查 users 表是否存在
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).get();

    if (!tables) {
      console.log('Creating users and sessions tables...');

      // 创建 users 表
      db.exec(`
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
      db.exec(`
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
    const columns = db.prepare("PRAGMA table_info(notes)").all();
    const columnNames = columns.map(row => row.name);

    if (!columnNames.includes('user_id')) {
      db.exec("ALTER TABLE notes ADD COLUMN user_id TEXT");
      console.log('Added user_id column to notes table');
    }

    if (!columnNames.includes('status')) {
      db.exec("ALTER TABLE notes ADD COLUMN status TEXT NOT NULL DEFAULT 'note'");
      console.log('Added status column to notes table');
    }

    if (!columnNames.includes('due_date')) {
      db.exec("ALTER TABLE notes ADD COLUMN due_date TEXT");
      console.log('Added due_date column to notes table');
    }

    if (!columnNames.includes('priority')) {
      db.exec("ALTER TABLE notes ADD COLUMN priority TEXT DEFAULT 'normal'");
      console.log('Added priority column to notes table');
    }

    if (!columnNames.includes('completed_at')) {
      db.exec("ALTER TABLE notes ADD COLUMN completed_at TEXT");
      console.log('Added completed_at column to notes table');
    }

    if (!columnNames.includes('deleted_at')) {
      db.exec("ALTER TABLE notes ADD COLUMN deleted_at TEXT");
      console.log('Added deleted_at column to notes table (soft delete)');
    }

    if (!columnNames.includes('version')) {
      db.exec("ALTER TABLE notes ADD COLUMN version INTEGER DEFAULT 1");
      console.log('Added version column to notes table (optimistic concurrency)');
    }

    if (!columnNames.includes('position')) {
      db.exec("ALTER TABLE notes ADD COLUMN position INTEGER DEFAULT 0");
      console.log('Added position column to notes table (ordering)');
    }

    if (!columnNames.includes('parent_id')) {
      db.exec("ALTER TABLE notes ADD COLUMN parent_id TEXT REFERENCES notes(id)");
      console.log('Added parent_id column to notes table (subtasks)');
    }

    if (!columnNames.includes('recurrence')) {
      db.exec("ALTER TABLE notes ADD COLUMN recurrence TEXT DEFAULT ''");
      console.log('Added recurrence column to notes table (recurring tasks)');
    }

    if (!columnNames.includes('category')) {
      db.exec("ALTER TABLE notes ADD COLUMN category TEXT DEFAULT ''");
      console.log('Added category column to notes table');
    }

    // 创建 categories 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        name        TEXT NOT NULL,
        color       TEXT NOT NULL DEFAULT '#3b82f6',
        position    INTEGER DEFAULT 0,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    db.exec("CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)");

    // 创建 FTS5 全文搜索虚拟表
    try {
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
          title, content,
          content=notes,
          content_rowid=rowid,
          tokenize='unicode61'
        )
      `);

      // 创建触发器保持 FTS 索引同步
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
          INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
        END
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
          INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
        END
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
          INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
          INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
        END
      `);

      console.log('Created FTS5 full-text search indexes');
    } catch (ftsErr) {
      // FTS5 可能在某些环境中不可用，但不影响核心功能
      console.warn('FTS5 not available (non-critical):', ftsErr.message);
    }

    console.log('Migration completed successfully');

  } catch (err) {
    console.error('Migration error:', err.message);
  }
}
