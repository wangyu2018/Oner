import { Router } from 'express';
import { getDb, saveDb } from '../db/index.js';
import { extractTags } from '../utils/tags.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 所有笔记接口都需要登录
router.use(authMiddleware);

// Helper to run query and return results
function queryAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function runQuery(sql, params = []) {
  const db = getDb();
  db.run(sql, params);
  saveDb();
}

// GET /api/notes - 获取笔记列表
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { tag, status, priority, sort, order, cursor, limit = 50 } = req.query;

  let sql = 'SELECT * FROM notes WHERE user_id = ?';
  const params = [userId];

  // 按标签筛选
  if (tag) {
    sql += " AND EXISTS (SELECT 1 FROM json_each(notes.tags) WHERE json_each.value = ?)";
    params.push(tag.toLowerCase());
  }

  // 按状态筛选
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  // 按优先级筛选
  if (priority) {
    sql += ' AND priority = ?';
    params.push(priority);
  }

  // 游标分页
  if (cursor) {
    sql += ' AND id < ?';
    params.push(cursor);
  }

  // 排序
  const validSorts = ['created_at', 'updated_at', 'due_date', 'priority'];
  const sortField = validSorts.includes(sort) ? sort : 'updated_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  // 优先级排序需要特殊处理
  if (sortField === 'priority') {
    sql += ` ORDER BY CASE priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END ${sortOrder}, updated_at DESC`;
  } else {
    sql += ` ORDER BY ${sortField} ${sortOrder}`;
  }

  // 限制返回数量
  const limitNum = Math.min(parseInt(limit) || 50, 100);
  sql += ' LIMIT ?';
  params.push(limitNum + 1); // 多查一条用于判断是否有更多数据

  const notes = queryAll(sql, params);

  // 判断是否有更多数据
  const hasMore = notes.length > limitNum;
  const resultNotes = hasMore ? notes.slice(0, limitNum) : notes;

  // 解析 tags JSON
  const parsed = resultNotes.map(n => ({
    ...n,
    tags: JSON.parse(n.tags || '[]')
  }));

  res.json({
    success: true,
    data: {
      notes: parsed,
      cursor: hasMore ? parsed[parsed.length - 1]?.id : null,
      hasMore
    }
  });
});

// POST /api/notes - 创建笔记
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { title = '', content = '', tags, status = 'note', due_date, priority = 'normal' } = req.body;

  const parsedTags = tags || extractTags(content);
  const id = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  // 验证状态值
  const validStatuses = ['note', 'todo', 'in_progress', 'done', 'archived'];
  const noteStatus = validStatuses.includes(status) ? status : 'note';

  // 验证优先级值
  const validPriorities = ['low', 'normal', 'high', 'urgent'];
  const notePriority = validPriorities.includes(priority) ? priority : 'normal';

  // 如果状态为 done，记录完成时间
  const completedAt = noteStatus === 'done' ? new Date().toISOString() : null;

  runQuery(`
    INSERT INTO notes (id, user_id, title, content, tags, status, due_date, priority, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, userId, title, content, JSON.stringify(parsedTags), noteStatus, due_date || null, notePriority, completedAt]);

  const note = queryOne('SELECT * FROM notes WHERE id = ?', [id]);
  res.status(201).json({
    success: true,
    data: {
      note: { ...note, tags: JSON.parse(note.tags) }
    }
  });
});

// GET /api/notes/:id - 获取单条笔记
router.get('/:id', (req, res) => {
  const userId = req.user.id;
  const note = queryOne('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  if (!note) {
    return res.status(404).json({
      success: false,
      error: '笔记不存在',
      code: 404
    });
  }

  res.json({
    success: true,
    data: {
      note: { ...note, tags: JSON.parse(note.tags) }
    }
  });
});

// PUT /api/notes/:id - 更新笔记
router.put('/:id', (req, res) => {
  const userId = req.user.id;
  const existing = queryOne('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: '笔记不存在',
      code: 404
    });
  }

  const title = req.body.title ?? existing.title;
  const content = req.body.content ?? existing.content;
  const tags = req.body.tags || extractTags(content);
  const status = req.body.status ?? existing.status;
  const due_date = req.body.due_date !== undefined ? req.body.due_date : existing.due_date;
  const priority = req.body.priority ?? existing.priority;

  // 验证状态值
  const validStatuses = ['note', 'todo', 'in_progress', 'done', 'archived'];
  const noteStatus = validStatuses.includes(status) ? status : existing.status;

  // 验证优先级值
  const validPriorities = ['low', 'normal', 'high', 'urgent'];
  const notePriority = validPriorities.includes(priority) ? priority : existing.priority;

  // 处理完成时间
  let completedAt = existing.completed_at;
  if (noteStatus === 'done' && existing.status !== 'done') {
    // 状态变为 done，记录完成时间
    completedAt = new Date().toISOString();
  } else if (noteStatus !== 'done' && existing.status === 'done') {
    // 状态从 done 变为其他，清除完成时间
    completedAt = null;
  }

  runQuery(`
    UPDATE notes
    SET title = ?, content = ?, tags = ?, status = ?, due_date = ?, priority = ?, completed_at = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `, [title, content, JSON.stringify(tags), noteStatus, due_date, notePriority, completedAt, req.params.id, userId]);

  const note = queryOne('SELECT * FROM notes WHERE id = ?', [req.params.id]);
  res.json({
    success: true,
    data: {
      note: { ...note, tags: JSON.parse(note.tags) }
    }
  });
});

// DELETE /api/notes/:id - 删除笔记
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const note = queryOne('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  if (!note) {
    return res.status(404).json({
      success: false,
      error: '笔记不存在',
      code: 404
    });
  }

  runQuery('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  res.json({
    success: true,
    data: {
      deleted: true,
      note: { ...note, tags: JSON.parse(note.tags) }
    }
  });
});

export default router;
