import { Router } from 'express';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { queryAll } from '../db/helpers.js';
import { authMiddleware } from '../middleware/auth.js';
import { backupLimiter } from '../middleware/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// 所有备份路由都需要身份验证
router.use(authMiddleware);

// GET /api/backup/export - download current user's notes as ZIP
router.get('/export', backupLimiter, (req, res) => {
  const notes = queryAll(
    "SELECT * FROM notes WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
    [req.user.id]
  );

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="oner-backup-${date}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  for (const note of notes) {
    const tags = JSON.parse(note.tags || '[]');
    const safeName = (note.title || 'untitled')
      .replace(/[<>:"/\\|?*]/g, '_')
      .slice(0, 80);

    const lines = [
      `# ${note.title || 'Untitled'}`,
      ''
    ];

    if (tags.length) {
      lines.push(`Tags: ${tags.map(t => '#' + t).join(' ')}`);
      lines.push('');
    }

    lines.push(`Created: ${note.created_at}`);
    lines.push(`Updated: ${note.updated_at}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(note.content);

    archive.append(lines.join('\n'), { name: `${safeName}-${note.id}.md` });
  }

  archive.append(
    JSON.stringify({
      app: 'Oner',
      exportDate: new Date().toISOString(),
      noteCount: notes.length
    }, null, 2),
    { name: 'manifest.json' }
  );

  archive.finalize();
});

// GET /api/backup/download-db - download the SQLite database
// ⚠️ 安全警告：此端点会暴露所有用户数据（含密码哈希）
// 仅限于管理员在受控环境使用
router.get('/download-db', backupLimiter, (req, res) => {
  console.warn(`[SECURITY] User ${req.user.id} (${req.user.username}) downloaded the database at ${new Date().toISOString()}`);
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'oner.db');
  if (fs.existsSync(dbPath)) {
    // 禁止在非开发环境下下载完整数据库
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: '生产环境禁止下载数据库', code: 403 });
    }
    res.download(dbPath, 'oner.db');
  } else {
    res.status(404).json({ error: 'Database file not found', code: 404 });
  }
});

export default router;
