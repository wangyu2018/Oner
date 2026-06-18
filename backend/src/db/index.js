import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { clearStmtCache } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'oner.db');

let db = null;

export function initDb() {
  // 确保数据库目录存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 清除旧的 Prepared Statement 缓存（旧语句绑定到旧 DB 连接）
  clearStmtCache();

  // 打开或创建数据库（实时文件写入，无需手动 save）
  db = new DatabaseSync(dbPath);

  // 启用 WAL 模式（更好的并发性能）
  db.exec('PRAGMA journal_mode=WAL');
  // 启用外键约束
  db.exec('PRAGMA foreign_keys=ON');

  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function closeDb() {
  if (db) {
    clearStmtCache();
    db.close();
    db = null;
  }
}
