import { Router } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, runQuery } from '../db/helpers.js';
import { extractTags } from '../utils/tags.js';
import { authMiddleware } from '../middleware/auth.js';
import { notesWriteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// 所有笔记接口都需要登录
router.use(authMiddleware);

function generateId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

function computeNextDueDate(currentDueDate, recurrence) {
  if (!recurrence || !currentDueDate) return null;
  const date = new Date(currentDueDate);
  if (isNaN(date.getTime())) return null;
  switch (recurrence) {
    case 'daily': date.setDate(date.getDate() + 1); break;
    case 'weekday': do { date.setDate(date.getDate() + 1); } while (date.getDay() === 0 || date.getDay() === 6); break;
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'biweekly': date.setDate(date.getDate() + 14); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    default: return null;
  }
  return date.toISOString().slice(0, 10);
}

// GET /api/notes - 获取笔记列表
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { tag, status, priority, sort, order, cursor, limit = 50, parent_id, category, include_subtasks } = req.query;

  let sql = `SELECT n.*,
    (SELECT COUNT(*) FROM notes s WHERE s.parent_id = n.id AND s.deleted_at IS NULL) as subtask_total,
    (SELECT COUNT(*) FROM notes s WHERE s.parent_id = n.id AND s.deleted_at IS NULL AND s.status = 'done') as subtask_done
    FROM notes n WHERE n.user_id = ? AND n.deleted_at IS NULL`;
  const params = [userId];

  if (include_subtasks === 'true') {
    // 看板视图：显示所有笔记包括子任务
  } else if (parent_id) {
    sql += ' AND n.parent_id = ?';
    params.push(parent_id);
  } else {
    sql += ' AND n.parent_id IS NULL';
  }

  if (tag) {
    sql += " AND EXISTS (SELECT 1 FROM json_each(n.tags) WHERE json_each.value = ?)";
    params.push(tag.toLowerCase());
  }
  if (status) { sql += ' AND n.status = ?'; params.push(status); }
  if (priority) { sql += ' AND n.priority = ?'; params.push(priority); }
  if (category) { sql += ' AND n.category = ?'; params.push(category); }
  if (cursor) { sql += ' AND n.id < ?'; params.push(cursor); }

  const validSorts = ['created_at', 'updated_at', 'due_date', 'priority', 'position'];
  const sortField = validSorts.includes(sort) ? sort : 'position';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  if (sortField === 'priority') {
    sql += ` ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 ELSE 5 END ${sortOrder}, position ASC`;
  } else {
    sql += ` ORDER BY ${sortField} ${sortOrder}, position ASC`;
  }

  const limitNum = Math.min(parseInt(limit) || 200, 500);
  sql += ' LIMIT ?';
  params.push(limitNum + 1);

  const notes = queryAll(sql, params);
  const hasMore = notes.length > limitNum;
  const resultNotes = hasMore ? notes.slice(0, limitNum) : notes;
  const parsed = resultNotes.map(n => ({ ...n, tags: JSON.parse(n.tags || '[]') }));

  res.json({ success: true, data: { notes: parsed, cursor: hasMore ? parsed[parsed.length - 1]?.id : null, hasMore } });
});

// POST /api/notes - 创建笔记
router.post('/', notesWriteLimiter, (req, res) => {
  const userId = req.user.id;
  const { title = '', content = '', tags, status = 'note', due_date, priority = 'normal', parent_id, recurrence, category } = req.body;

  // 输入长度验证
  if (title.length > 200) {
    return res.status(400).json({ success: false, error: '标题不能超过200个字符', code: 400 });
  }
  if (content.length > 100000) {
    return res.status(400).json({ success: false, error: '内容不能超过100000个字符', code: 400 });
  }

  const parsedTags = tags || extractTags(content);
  const id = generateId();

  const validStatuses = ['note', 'todo', 'in_progress', 'done', 'archived'];
  const noteStatus = validStatuses.includes(status) ? status : 'note';
  const validPriorities = ['low', 'normal', 'high', 'urgent'];
  const notePriority = validPriorities.includes(priority) ? priority : 'normal';
  const completedAt = noteStatus === 'done' ? new Date().toISOString() : null;

  if (parent_id) {
    const parent = queryOne('SELECT id FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [parent_id, userId]);
    if (!parent) {
      return res.status(400).json({ success: false, error: '父笔记不存在', code: 400 });
    }
  }

  const validRecurrences = ['daily', 'weekday', 'weekly', 'biweekly', 'monthly', 'yearly'];
  const noteRecurrence = validRecurrences.includes(recurrence) ? recurrence : '';

  runQuery(`
    INSERT INTO notes (id, user_id, title, content, tags, status, due_date, priority, completed_at, parent_id, recurrence, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, userId, title, content, JSON.stringify(parsedTags), noteStatus, due_date || null, notePriority, completedAt, parent_id || null, noteRecurrence, category || '']);

  const note = queryOne('SELECT * FROM notes WHERE id = ?', [id]);
  res.status(201).json({ success: true, data: { note: { ...note, tags: JSON.parse(note.tags) } } });
});

// POST /api/notes/batch - 批量操作笔记
router.post('/batch', notesWriteLimiter, (req, res) => {
  const userId = req.user.id;
  const { ids = [], action, status, priority } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: '请选择至少一条笔记', code: 400 });
  }
  if (ids.length > 100) {
    return res.status(400).json({ success: false, error: '单次最多操作100条笔记', code: 400 });
  }

  const validActions = ['delete', 'update_status', 'update_priority'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ success: false, error: '无效的操作类型', code: 400 });
  }

  const placeholders = ids.map(() => '?').join(',');
  let affected = 0;

  if (action === 'delete') {
    const result = runQuery(
      `UPDATE notes SET deleted_at=datetime('now'), updated_at=datetime('now')
       WHERE id IN (${placeholders}) AND user_id=? AND deleted_at IS NULL`,
      [...ids, userId]
    );
    affected = result?.changes || 0;
    runQuery(
      `UPDATE notes SET deleted_at=datetime('now'), updated_at=datetime('now')
       WHERE parent_id IN (${placeholders}) AND user_id=? AND deleted_at IS NULL`,
      [...ids, userId]
    );
  } else if (action === 'update_status') {
    const validStatuses = ['note', 'todo', 'in_progress', 'done', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: '无效的状态', code: 400 });
    }
    const completedAt = status === 'done' ? new Date().toISOString() : null;
    const result = runQuery(
      `UPDATE notes SET status=?, completed_at=?, updated_at=datetime('now')
       WHERE id IN (${placeholders}) AND user_id=? AND deleted_at IS NULL`,
      [status, completedAt, ...ids, userId]
    );
    affected = result?.changes || 0;
  } else if (action === 'update_priority') {
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, error: '无效的优先级', code: 400 });
    }
    const result = runQuery(
      `UPDATE notes SET priority=?, updated_at=datetime('now')
       WHERE id IN (${placeholders}) AND user_id=? AND deleted_at IS NULL`,
      [priority, ...ids, userId]
    );
    affected = result?.changes || 0;
  }

  res.json({ success: true, data: { affected, action } });
});

// GET /api/notes/:id - 获取单条笔记
router.get('/:id', (req, res) => {
  const userId = req.user.id;
  const note = queryOne('SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [req.params.id, userId]);
  if (!note) return res.status(404).json({ success: false, error: '笔记不存在', code: 404 });
  res.json({ success: true, data: { note: { ...note, tags: JSON.parse(note.tags) } } });
});

// GET /api/notes/:id/subtasks - 获取子任务列表
router.get('/:id/subtasks', (req, res) => {
  const userId = req.user.id;
  const parent = queryOne('SELECT id FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [req.params.id, userId]);
  if (!parent) return res.status(404).json({ success: false, error: '笔记不存在', code: 404 });

  const subtasks = queryAll("SELECT * FROM notes WHERE parent_id = ? AND user_id = ? AND deleted_at IS NULL ORDER BY position ASC, created_at ASC", [req.params.id, userId]);
  const parsed = subtasks.map(n => ({ ...n, tags: JSON.parse(n.tags || '[]') }));
  const total = parsed.length;
  const done = parsed.filter(n => n.status === 'done').length;
  res.json({ success: true, data: { subtasks: parsed, progress: { total, done } } });
});

// POST /api/notes/:id/subtasks - 创建子任务
router.post('/:id/subtasks', notesWriteLimiter, (req, res) => {
  const userId = req.user.id;
  const parent = queryOne('SELECT id FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [req.params.id, userId]);
  if (!parent) return res.status(404).json({ success: false, error: '笔记不存在', code: 404 });

  const { title = '', content = '' } = req.body;
  if (!title.trim()) return res.status(400).json({ success: false, error: '子任务标题不能为空', code: 400 });

  // 输入长度验证
  if (title.length > 200) {
    return res.status(400).json({ success: false, error: '标题不能超过200个字符', code: 400 });
  }

  const id = generateId();
  runQuery("INSERT INTO notes (id, user_id, title, content, status, parent_id, tags) VALUES (?, ?, ?, ?, 'todo', ?, '[]')", [id, userId, title, content, req.params.id]);
  const subtask = queryOne('SELECT * FROM notes WHERE id = ?', [id]);
  res.status(201).json({ success: true, data: { subtask: { ...subtask, tags: [] } } });
});

// PUT /api/notes/:id - 更新笔记
router.put('/:id', notesWriteLimiter, (req, res) => {
  const userId = req.user.id;
  const existing = queryOne('SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [req.params.id, userId]);
  if (!existing) return res.status(404).json({ success: false, error: '笔记不存在', code: 404 });

  // 版本冲突检测
  if (req.body.version !== undefined && req.body.version !== (existing.version || 1)) {
    return res.status(409).json({
      success: false,
      error: '笔记已被其他设备修改，请刷新后重试',
      code: 409,
      data: { serverVersion: existing.version, clientVersion: req.body.version }
    });
  }

  const title = (req.body.title !== undefined ? req.body.title : existing.title) || '';
  const content = (req.body.content !== undefined ? req.body.content : existing.content) || '';

  // 输入长度验证
  if (title.length > 200) {
    return res.status(400).json({ success: false, error: '标题不能超过200个字符', code: 400 });
  }
  if (content.length > 100000) {
    return res.status(400).json({ success: false, error: '内容不能超过100000个字符', code: 400 });
  }

  const tags = req.body.tags || extractTags(content);
  const status = req.body.status ?? existing.status;
  const due_date = req.body.due_date !== undefined ? req.body.due_date : existing.due_date;
  const priority = req.body.priority ?? existing.priority;
  const position = req.body.position !== undefined ? req.body.position : existing.position;
  const recurrence = req.body.recurrence !== undefined ? req.body.recurrence : (existing.recurrence || '');
  const category = req.body.category !== undefined ? req.body.category : (existing.category || '');
  // parent_id: 传 null 时清除（子任务提升为顶层），传 undefined 时保留原值
  const parent_id = req.body.parent_id !== undefined ? req.body.parent_id : existing.parent_id;

  const validStatuses = ['note', 'todo', 'in_progress', 'done', 'archived'];
  const noteStatus = validStatuses.includes(status) ? status : existing.status;
  const validPriorities = ['low', 'normal', 'high', 'urgent'];
  const notePriority = validPriorities.includes(priority) ? priority : existing.priority;

  let completedAt = existing.completed_at;
  if (noteStatus === 'done' && existing.status !== 'done') completedAt = new Date().toISOString();
  else if (noteStatus !== 'done' && existing.status === 'done') completedAt = null;

  const validRecurrences = ['daily', 'weekday', 'weekly', 'biweekly', 'monthly', 'yearly'];
  const noteRecurrence = validRecurrences.includes(recurrence) ? recurrence : '';
  const newVersion = (existing.version || 1) + 1;

  runQuery(`
    UPDATE notes SET title=?, content=?, tags=?, status=?, due_date=?, priority=?,
      completed_at=?, version=?, position=?, recurrence=?, category=?, parent_id=?, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `, [title, content, JSON.stringify(tags), noteStatus, due_date, notePriority, completedAt, newVersion, position, noteRecurrence, category, parent_id, req.params.id, userId]);

  // 重复任务完成自动创建下一周期
  if (noteStatus === 'done' && existing.status !== 'done' && existing.recurrence && existing.due_date) {
    const nextDue = computeNextDueDate(existing.due_date, existing.recurrence);
    if (nextDue) {
      const newId = generateId();
      runQuery("INSERT INTO notes (id, user_id, title, content, tags, status, due_date, priority, recurrence, category) VALUES (?, ?, ?, ?, ?, 'todo', ?, ?, ?, ?)",
        [newId, existing.user_id, existing.title, existing.content, existing.tags, nextDue, existing.priority || 'normal', existing.recurrence, existing.category || '']);
    }
  }

  const note = queryOne('SELECT * FROM notes WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: { note: { ...note, tags: JSON.parse(note.tags) } } });
});

// DELETE /api/notes/:id - 软删除笔记（同时删除子任务）
router.delete('/:id', notesWriteLimiter, (req, res) => {
  const userId = req.user.id;
  const note = queryOne('SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [req.params.id, userId]);
  if (!note) return res.status(404).json({ success: false, error: '笔记不存在', code: 404 });

  runQuery("UPDATE notes SET deleted_at=datetime('now'), updated_at=datetime('now') WHERE id=? AND user_id=?", [req.params.id, userId]);
  runQuery("UPDATE notes SET deleted_at=datetime('now'), updated_at=datetime('now') WHERE parent_id=? AND user_id=?", [req.params.id, userId]);
  res.json({ success: true, data: { deleted: true, note: { ...note, tags: JSON.parse(note.tags) } } });
});

export default router;
