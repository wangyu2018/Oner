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

// GET /api/backup/download-db - 已禁用
// ⚠️ 安全策略：此端点已永久禁用，防止数据库泄露
router.get('/download-db', (req, res) => {
  console.warn(`[SECURITY] Blocked database download attempt by user ${req.user.id} at ${new Date().toISOString()}`);
  res.status(403).json({ error: '此端点已禁用', code: 403 });
});

export default router;
