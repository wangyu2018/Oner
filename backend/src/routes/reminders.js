import { Router } from 'express';
import { queryAll } from '../db/helpers.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/reminders - 获取到期提醒列表
router.get('/', (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // 已过期的待办
  const overdue = queryAll(
    "SELECT id, title, due_date, status, priority FROM notes WHERE user_id = ? AND deleted_at IS NULL AND status IN ('todo', 'in_progress') AND due_date IS NOT NULL AND due_date < ? ORDER BY due_date ASC",
    [userId, today]
  );

  // 今天到期的
  const dueToday = queryAll(
    "SELECT id, title, due_date, status, priority FROM notes WHERE user_id = ? AND deleted_at IS NULL AND status IN ('todo', 'in_progress') AND due_date = ? ORDER BY priority ASC",
    [userId, today]
  );

  // 明天到期的
  const dueTomorrow = queryAll(
    "SELECT id, title, due_date, status, priority FROM notes WHERE user_id = ? AND deleted_at IS NULL AND status IN ('todo', 'in_progress') AND due_date = ? ORDER BY priority ASC",
    [userId, tomorrow]
  );

  res.json({
    success: true,
    data: {
      overdue: overdue.map(n => ({
        ...n,
        days: Math.ceil((Date.now() - new Date(n.due_date).getTime()) / 86400000)
      })),
      due_today: dueToday,
      due_tomorrow: dueTomorrow,
      total: overdue.length + dueToday.length + dueTomorrow.length
    }
  });
});

export default router;
