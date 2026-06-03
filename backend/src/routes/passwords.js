import { Router } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { queryAll, queryOne, runQuery } from '../db/helpers.js';
import { encryptVaultPassword, decryptVaultPassword } from '../utils/crypto.js';

const router = Router();

router.use(authMiddleware);

function generateId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

// GET /api/passwords - 列出所有密码条目（不返回加密密码）
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let sql = `SELECT id, title, url, username, category, include_in_search, created_at, updated_at
               FROM password_entries WHERE user_id = ?`;
    const params = [req.user.id];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY updated_at DESC';

    const entries = queryAll(sql, params);
    res.json({ success: true, data: { entries } });
  } catch (err) {
    console.error('List passwords error:', err);
    res.status(500).json({ success: false, error: '获取密码列表失败', code: 500 });
  }
});

// GET /api/passwords/:id - 获取单个密码条目
router.get('/:id', (req, res) => {
  try {
    const entry = queryOne(
      'SELECT * FROM password_entries WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!entry) {
      return res.status(404).json({ success: false, error: '条目不存在', code: 404 });
    }
    // 返回加密密码，前端不展示
    res.json({ success: true, data: { entry } });
  } catch (err) {
    console.error('Get password error:', err);
    res.status(500).json({ success: false, error: '获取密码失败', code: 500 });
  }
});

// GET /api/passwords/:id/decrypt - 解密并返回明文密码
router.get('/:id/decrypt', (req, res) => {
  try {
    const entry = queryOne(
      'SELECT encrypted_password FROM password_entries WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!entry) {
      return res.status(404).json({ success: false, error: '条目不存在', code: 404 });
    }
    const plaintext = decryptVaultPassword(entry.encrypted_password);
    if (plaintext === null) {
      return res.status(500).json({ success: false, error: '解密失败', code: 500 });
    }
    res.json({ success: true, data: { password: plaintext } });
  } catch (err) {
    console.error('Decrypt password error:', err);
    res.status(500).json({ success: false, error: '解密失败', code: 500 });
  }
});

// POST /api/passwords - 创建密码条目
router.post('/', (req, res) => {
  try {
    const { title, url, username, password, notes, category, include_in_search } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: '密码必填', code: 400 });
    }

    const id = generateId();
    const encrypted = encryptVaultPassword(password);
    const incSearch = include_in_search ? 1 : 0;

    runQuery(
      `INSERT INTO password_entries (id, user_id, title, url, username, encrypted_password, notes, category, include_in_search)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, title || '', url || '', username || '', encrypted, notes || '', category || '', incSearch]
    );

    const entry = queryOne(
      'SELECT id, title, url, username, category, include_in_search, created_at, updated_at FROM password_entries WHERE id = ?',
      [id]
    );

    res.status(201).json({ success: true, data: { entry } });
  } catch (err) {
    console.error('Create password error:', err);
    res.status(500).json({ success: false, error: '创建失败', code: 500 });
  }
});

// PUT /api/passwords/:id - 更新密码条目
router.put('/:id', (req, res) => {
  try {
    const existing = queryOne(
      'SELECT * FROM password_entries WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ success: false, error: '条目不存在', code: 404 });
    }

    const { title, url, username, password, notes, category, include_in_search } = req.body;

    const newTitle = title !== undefined ? title : existing.title;
    const newUrl = url !== undefined ? url : existing.url;
    const newUsername = username !== undefined ? username : existing.username;
    const newNotes = notes !== undefined ? notes : existing.notes;
    const newCategory = category !== undefined ? category : existing.category;
    const newIncSearch = include_in_search !== undefined ? (include_in_search ? 1 : 0) : existing.include_in_search;
    const newEncrypted = password ? encryptVaultPassword(password) : existing.encrypted_password;

    runQuery(
      `UPDATE password_entries SET title=?, url=?, username=?, encrypted_password=?, notes=?, category=?, include_in_search=?, updated_at=datetime('now')
       WHERE id=?`,
      [newTitle, newUrl, newUsername, newEncrypted, newNotes, newCategory, newIncSearch, req.params.id]
    );

    const entry = queryOne(
      'SELECT id, title, url, username, category, include_in_search, created_at, updated_at FROM password_entries WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, data: { entry } });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ success: false, error: '更新失败', code: 500 });
  }
});

// PATCH /api/passwords/:id/settings - 更新搜索开关等设置
router.patch('/:id/settings', (req, res) => {
  try {
    const { include_in_search } = req.body;
    if (include_in_search === undefined) {
      return res.status(400).json({ success: false, error: '缺少参数', code: 400 });
    }
    const result = runQuery(
      `UPDATE password_entries SET include_in_search=?, updated_at=datetime('now') WHERE id=? AND user_id=?`,
      [include_in_search ? 1 : 0, req.params.id, req.user.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '条目不存在', code: 404 });
    }
    res.json({ success: true, data: { include_in_search: !!include_in_search } });
  } catch (err) {
    console.error('Update password settings error:', err);
    res.status(500).json({ success: false, error: '更新失败', code: 500 });
  }
});

// DELETE /api/passwords/:id - 删除密码条目
router.delete('/:id', (req, res) => {
  try {
    const result = runQuery(
      'DELETE FROM password_entries WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '条目不存在', code: 404 });
    }
    res.json({ success: true, data: { message: '已删除' } });
  } catch (err) {
    console.error('Delete password error:', err);
    res.status(500).json({ success: false, error: '删除失败', code: 500 });
  }
});

export default router;
