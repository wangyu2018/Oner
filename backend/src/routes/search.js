import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { queryAll } from '../db/helpers.js';

const router = Router();

router.use(authMiddleware);

// GET /api/search?q=关键词&category=分类名&include_passwords=true&limit=20
router.get('/', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const category = (req.query.category || '').trim();
    const includePasswords = req.query.include_passwords === 'true';
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const userId = req.user.id;

    if (!q) {
      return res.json({ success: true, data: { results: [] } });
    }

    // LIKE 转义
    const escaped = q.replace(/[%_]/g, '\\$&');
    const pattern = `%${escaped}%`;

    const results = [];

    // 搜索笔记（title + content），可选按分类过滤
    const noteParams = [userId, pattern, pattern];
    let categoryClause = '';
    if (category) {
      categoryClause = ' AND category = ?';
      noteParams.push(category);
    }
    noteParams.push(`${escaped}%`, limit);

    const notes = queryAll(
      `SELECT id, title, content, status, priority, category, tags, due_date, updated_at,
              'note' as result_type
       FROM notes
       WHERE user_id = ? AND deleted_at IS NULL
         AND (title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')${categoryClause}
       ORDER BY
         CASE WHEN title LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END,
         updated_at DESC
       LIMIT ?`,
      noteParams
    );
    results.push(...notes);

    // 搜索密码条目（仅在开启时）
    if (includePasswords) {
      const passwords = queryAll(
        `SELECT id, title, url, username, category, created_at, updated_at,
                'password_entry' as result_type
         FROM password_entries
         WHERE user_id = ? AND include_in_search = 1
           AND (title LIKE ? ESCAPE '\\' OR url LIKE ? ESCAPE '\\' OR username LIKE ? ESCAPE '\\')
         ORDER BY
           CASE WHEN title LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END,
           updated_at DESC
         LIMIT ?`,
        [userId, pattern, pattern, pattern, `${escaped}%`, limit]
      );
      results.push(...passwords);
    }

    // 综合排序：精确标题匹配优先，然后按 updated_at
    results.sort((a, b) => {
      const aExact = a.title === q ? 0 : 1;
      const bExact = b.title === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    // 截断到 limit
    const limited = results.slice(0, limit);

    res.json({ success: true, data: { results: limited } });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: '搜索失败', code: 500 });
  }
});

export default router;
