/**
 * 字典识别器 — 不依赖 AI，纯规则识别
 *
 * 用法：
 *   const result = recognizeMemo('买牛奶 明天下午');
 *   → { type: 'todo', priority: 'medium', dueDate: '2026-06-14 PM', tags: [] }
 */
import { TIME_KEYWORDS, ACTION_VERBS, PRIORITY_KEYWORDS } from '../constants';

/**
 * 识别输入类型
 * @param {string} text - 用户输入的原始文本
 * @returns {{
 *   type: 'todo' | 'note' | 'question',
 *   priority: 'low' | 'medium' | 'high' | 'urgent',
 *   dueDate: string | null,
 *   dueDateLabel: string | null,
 *   tags: string[],
 *   raw: string
 * }}
 */
export function recognizeMemo(text) {
  if (!text || !text.trim()) {
    return null;
  }

  const trimmed = text.trim();

  return {
    type: detectType(trimmed),
    priority: detectPriority(trimmed),
    dueDate: detectDueDate(trimmed),
    dueDateLabel: detectDueDateLabel(trimmed),
    tags: detectTags(trimmed),
    raw: trimmed
  };
}

/**
 * 检测类型：待办 / 备忘 / 问题
 */
function detectType(text) {
  // 优先级：问题 > 待办 > 备忘
  for (const keyword of ACTION_VERBS.question) {
    if (text.includes(keyword)) {
      return 'question';
    }
  }

  let todoScore = 0;
  let noteScore = 0;

  for (const verb of ACTION_VERBS.todo) {
    if (text.startsWith(verb) || text.includes(` ${verb} `) || text.includes(` ${verb}`)) {
      todoScore += 1;
    }
  }

  for (const verb of ACTION_VERBS.note) {
    if (text.includes(verb)) {
      noteScore += 1;
    }
  }

  // 含时间词 + 动作词 = 强 todo 信号
  const hasTime = Object.values(TIME_KEYWORDS).flat().some(k => text.includes(k));
  if (hasTime && todoScore > 0) return 'todo';

  return todoScore > noteScore ? 'todo' : 'note';
}

/**
 * 检测优先级
 */
function detectPriority(text) {
  for (const keyword of PRIORITY_KEYWORDS.urgent) {
    if (text.includes(keyword)) return 'urgent';
  }
  for (const keyword of PRIORITY_KEYWORDS.high) {
    if (text.includes(keyword)) return 'high';
  }
  for (const keyword of PRIORITY_KEYWORDS.low) {
    if (text.includes(keyword)) return 'low';
  }
  return 'medium';
}

/**
 * 检测截止日期（返回 ISO 字符串）
 */
function detectDueDate(text) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 绝对日期
  if (text.includes('今天')) {
    return today.toISOString();
  }
  if (text.includes('明天')) {
    return tomorrow.toISOString();
  }
  if (text.includes('后天')) {
    const day = new Date(today);
    day.setDate(day.getDate() + 2);
    return day.toISOString();
  }
  if (text.includes('下周')) {
    const day = new Date(today);
    day.setDate(day.getDate() + 7);
    return day.toISOString();
  }

  // 相对日期（暂时只识别今天/明天/后天）
  return null;
}

/**
 * 检测截止日期的显示文本
 */
function detectDueDateLabel(text) {
  if (text.includes('今天')) return '今天';
  if (text.includes('明天')) return '明天';
  if (text.includes('后天')) return '后天';
  if (text.includes('下周')) return '下周';
  return null;
}

/**
 * 检测标签（#xxx 形式）
 */
function detectTags(text) {
  const matches = text.match(/#[\w\u4e00-\u9fa5]+/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}
