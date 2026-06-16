import { beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.resolve(__dirname, '..', 'test-oner.db');

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
  process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
  process.env.DB_PATH = TEST_DB_PATH;
  process.env.NODE_ENV = 'test';
  process.env.WX_APPID = 'test-appid';
  process.env.WX_SECRET = 'test-secret';
});

afterAll(() => {
  // 清理测试数据库文件
  [TEST_DB_PATH, TEST_DB_PATH + '-wal', TEST_DB_PATH + '-shm'].forEach(f => {
    try { fs.unlinkSync(f); } catch {}
  });
});
