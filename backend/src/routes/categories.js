import { Router } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, runQuery } from '../db/helpers.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

function generateId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

// GET /api/categories - 获取用户分类
router.get('/', (req, res) => {
  const userId = req.user.id;
  const categories = queryAll(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY position ASC, created_at ASC',
    [userId]
  );
  res.json({ success: true, data: { categories } });
});

// 验证颜色值是否为有效的 HEX 颜色
function isValidHexColor(color) {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

// POST /api/categories - 创建分类
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { name, color = '#3b82f6' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: '分类名称不能为空', code: 400 });
  }

  if (name.trim().length > 30) {
    return res.status(400).json({ success: false, error: '分类名称不能超过30个字符', code: 400 });
  }

  if (!isValidHexColor(color)) {
    return res.status(400).json({ success: false, error: '颜色值格式无效，需要使用 #RRGGBB 格式', code: 400 });
  }

  const id = generateId();
  runQuery(
    'INSERT INTO categories (id, user_id, name, color) VALUES (?, ?, ?, ?)',
    [id, userId, name.trim(), color]
  );

  const category = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  res.status(201).json({ success: true, data: { category } });
});

// PUT /api/categories/:id - 更新分类
router.put('/:id', (req, res) => {
  const userId = req.user.id;
  const existing = queryOne('SELECT * FROM categories WHERE id = ? AND user_id = ?', [req.params.id, userId]);
  if (!existing) {
    return res.status(404).json({ success: false, error: '分类不存在', code: 404 });
  }

  const name = req.body.name !== undefined ? req.body.name : existing.name;
  const color = req.body.color !== undefined ? req.body.color : existing.color;
  const position = req.body.position !== undefined ? req.body.position : existing.position;

  if (name && name.trim().length > 30) {
    return res.status(400).json({ success: false, error: '分类名称不能超过30个字符', code: 400 });
  }

  if (req.body.color !== undefined && !isValidHexColor(color)) {
    return res.status(400).json({ success: false, error: '颜色值格式无效，需要使用 #RRGGBB 格式', code: 400 });
  }

  runQuery(
    'UPDATE categories SET name = ?, color = ?, position = ? WHERE id = ? AND user_id = ?',
    [name, color, position, req.params.id, userId]
  );

  const category = queryOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: { category } });
});

// DELETE /api/categories/:id - 删除分类
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const existing = queryOne('SELECT * FROM categories WHERE id = ? AND user_id = ?', [req.params.id, userId]);
  if (!existing) {
    return res.status(404).json({ success: false, error: '分类不存在', code: 404 });
  }

  runQuery('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, userId]);
  // 将该分类下的笔记分类清空
  runQuery("UPDATE notes SET category = '' WHERE category = ? AND user_id = ?", [existing.name, userId]);

  res.json({ success: true, data: { deleted: true } });
});

export default router;
