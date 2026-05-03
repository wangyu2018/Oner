import { Router } from 'express';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getDb } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Helper to run query and return results
function queryAll(sql) {
  const db = getDb();
  const stmt = db.prepare(sql);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// GET /api/backup/export - download all notes as ZIP
router.get('/export', (req, res) => {
  const notes = queryAll('SELECT * FROM notes ORDER BY created_at ASC');

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
router.get('/download-db', (req, res) => {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'oner.db');
  if (fs.existsSync(dbPath)) {
    res.download(dbPath, 'oner.db');
  } else {
    res.status(404).json({ error: 'Database file not found', code: 404 });
  }
});

export default router;
