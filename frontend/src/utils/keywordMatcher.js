/**
 * 关键词匹配工具
 * 自动从用户分类 + 内置规则生成关键词库
 */

// 内置日期关键词
const DATE_KEYWORDS = {
  '今天': () => { const d = new Date(); return d.toISOString().slice(0, 10); },
  '明日': () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); },
  '明天': () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); },
  '后天': () => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().slice(0, 10); },
  '下周': () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); },
  '下月': () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); },
};

// 内置状态关键词
const STATUS_KEYWORDS = {
  '买': 'todo', '完成': 'todo', '提交': 'todo', '处理': 'todo',
  '做': 'todo', '写': 'todo', '发': 'todo', '打': 'todo',
  '修': 'todo', '改': 'todo', '创建': 'todo', '准备': 'todo',
  '检查': 'todo', '确认': 'todo', '联系': 'todo', '通知': 'todo',
  '记录': 'note', '备忘': 'note', '笔记': 'note',
};

// 内置优先级关键词
const PRIORITY_KEYWORDS = {
  '紧急': 'urgent', '立刻': 'urgent', '马上': 'urgent',
  '重要': 'high', '加急': 'urgent', '优先': 'high',
};

// 内置提醒关键词
const REMINDER_KEYWORDS = ['提醒', '别忘了', '记得', '不要忘'];

/**
 * 匹配输入文本中的关键词
 * @param {string} text - 用户输入文本
 * @param {Array} categories - 用户分类列表 [{ name, color }]
 * @returns {Object} { date, status, priority, remind, category }
 */
export function matchKeywords(text, categories = []) {
  const result = { date: null, status: null, priority: null, remind: false, category: null };

  // 匹配日期
  for (const [word, getDate] of Object.entries(DATE_KEYWORDS)) {
    if (text.includes(word)) {
      result.date = getDate();
      break;
    }
  }

  // 匹配状态
  for (const [word, status] of Object.entries(STATUS_KEYWORDS)) {
    if (text.includes(word)) {
      result.status = status;
      break;
    }
  }

  // 匹配优先级
  for (const [word, priority] of Object.entries(PRIORITY_KEYWORDS)) {
    if (text.includes(word)) {
      result.priority = priority;
      break;
    }
  }

  // 匹配提醒
  result.remind = REMINDER_KEYWORDS.some(word => text.includes(word));
  // 提醒关键词命中且无明确状态时，默认待办
  if (result.remind && !result.status) {
    result.status = 'todo';
  }

  // 匹配分类（用户自定义的）
  for (const cat of categories) {
    if (text.includes(cat.name)) {
      result.category = cat.name;
      break;
    }
  }

  return result;
}

/**
 * 获取文本中被命中的关键词位置信息（用于视觉高亮）
 * @param {string} text - 用户输入文本
 * @param {Array} categories - 用户分类列表 [{ name, color }]
 * @returns {Array} [{ word, type, start, end }]
 */
export function getHighlightRanges(text, categories = []) {
  const ranges = [];

  // 日期
  for (const word of Object.keys(DATE_KEYWORDS)) {
    const idx = text.indexOf(word);
    if (idx !== -1) {
      ranges.push({ word, type: 'date', start: idx, end: idx + word.length });
    }
  }

  // 状态
  for (const [word, status] of Object.entries(STATUS_KEYWORDS)) {
    const idx = text.indexOf(word);
    if (idx !== -1) {
      ranges.push({ word, type: 'status', start: idx, end: idx + word.length, subType: status });
    }
  }

  // 优先级
  for (const [word, priority] of Object.entries(PRIORITY_KEYWORDS)) {
    const idx = text.indexOf(word);
    if (idx !== -1) {
      ranges.push({ word, type: 'priority', start: idx, end: idx + word.length, subType: priority });
    }
  }

  // 分类
  for (const cat of categories) {
    const idx = text.indexOf(cat.name);
    if (idx !== -1) {
      ranges.push({ word: cat.name, type: 'category', start: idx, end: idx + cat.name.length, color: cat.color });
    }
  }

  // 排序（按出现位置）
  ranges.sort((a, b) => a.start - b.start);

  return ranges;
}

/**
 * 高亮颜色配置
 */
export const HIGHLIGHT_STYLES = {
  date: { textColor: '#2563eb', label: '日期', bgColor: '#dbeafe' },
  status: { textColor: '#ea580c', label: '状态', bgColor: '#fff7ed' },
  priority: { textColor: '#dc2626', label: '优先级', bgColor: '#fef2f2' },
  remind: { textColor: '#9333ea', label: '提醒', bgColor: '#faf5ff' },
  category: { textColor: '#16a34a', label: '分类', bgColor: '#f0fdf4' },
};
