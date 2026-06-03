import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import { queryAll, queryOne, runQuery } from '../db/helpers.js';

const router = Router();
router.use(authMiddleware);

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(import.meta.dirname, '..', '..', 'uploads'));
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, req.user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    cb(null, `${name}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
});

function generateId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

// POST /api/files/upload?note_id=xxx - 上传文件
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, error: '文件大小超过限制 (10MB)', code: 413 });
        }
        return res.status(400).json({ success: false, error: err.message, code: 400 });
      }
      return res.status(500).json({ success: false, error: '上传失败', code: 500 });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: '请选择文件', code: 400 });
      }

      const noteId = req.query.note_id || null;
      const id = generateId();
      const filePath = path.join(req.user.id, req.file.filename);

      runQuery(
        `INSERT INTO file_attachments (id, user_id, note_id, filename, original_name, mime_type, size)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, req.user.id, noteId, filePath, req.file.originalname, req.file.mimetype, req.file.size]
      );

      const attachment = queryOne('SELECT * FROM file_attachments WHERE id = ?', [id]);

      res.status(201).json({ success: true, data: { attachment } });
    } catch (dbErr) {
      console.error('File upload DB error:', dbErr);
      res.status(500).json({ success: false, error: '上传失败', code: 500 });
    }
  });
});

// GET /api/files?note_id=xxx - 列出笔记的文件
router.get('/', (req, res) => {
  try {
    const { note_id, all } = req.query;
    let sql = 'SELECT id, note_id, filename, original_name, mime_type, size, created_at FROM file_attachments WHERE user_id = ?';
    const params = [req.user.id];

    if (note_id) {
      sql += ' AND note_id = ?';
      params.push(note_id);
    }

    if (all !== 'true') {
      sql += ' AND note_id IS NOT NULL';
    }

    sql += ' ORDER BY created_at DESC';

    const files = queryAll(sql, params);
    res.json({ success: true, data: { files } });
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ success: false, error: '获取文件列表失败', code: 500 });
  }
});

// GET /api/files/:id/download - 下载文件
router.get('/:id/download', (req, res) => {
  try {
    const file = queryOne(
      'SELECT * FROM file_attachments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!file) {
      return res.status(404).json({ success: false, error: '文件不存在', code: 404 });
    }

    const filePath = path.join(UPLOAD_DIR, file.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '文件已丢失', code: 404 });
    }

    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Length', file.size);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ success: false, error: '下载失败', code: 500 });
  }
});

// DELETE /api/files/:id - 删除文件
router.delete('/:id', (req, res) => {
  try {
    const file = queryOne(
      'SELECT * FROM file_attachments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!file) {
      return res.status(404).json({ success: false, error: '文件不存在', code: 404 });
    }

    // 删除物理文件
    const filePath = path.join(UPLOAD_DIR, file.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsErr) {
      console.warn('Failed to delete physical file:', fsErr.message);
    }

    // 删除数据库记录
    runQuery('DELETE FROM file_attachments WHERE id = ?', [req.params.id]);

    res.json({ success: true, data: { message: '已删除' } });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ success: false, error: '删除失败', code: 500 });
  }
});

export default router;
