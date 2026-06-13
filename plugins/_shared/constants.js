/**
 * Oner 插件 SDK — 常量定义
 */

// 插件类型
export const PLUGIN_TYPES = Object.freeze({
  CORE: 'core',         // 核心插件（不可卸载）
  OFFICIAL: 'official', // 官方可选插件
  THIRD_PARTY: 'third_party',
  COMMUNITY: 'community'
});

// 插件状态
export const PLUGIN_STATUS = Object.freeze({
  INSTALLED: 'installed',     // 已安装
  ENABLED: 'enabled',         // 已启用
  DISABLED: 'disabled',       // 已停用
  UPDATING: 'updating',       // 更新中
  ERROR: 'error'              // 错误
});

// 风险等级
export const RISK_LEVEL = Object.freeze({
  LOW: 'low',         // 只读操作
  MEDIUM: 'medium',   // 新增 UI/表
  HIGH: 'high',       // 改核心路由
  CRITICAL: 'critical' // 改内核
});

// UI Slot
export const UI_SLOTS = Object.freeze({
  SIDEBAR_MAIN: 'sidebar.main',
  SIDEBAR_BOTTOM: 'sidebar.bottom',
  TOPBAR_LEFT: 'topbar.left',
  TOPBAR_CENTER: 'topbar.center',
  TOPBAR_RIGHT: 'topbar.right',
  COMMANDBAR_QUICK: 'commandbar.quick',
  PAGE_NOTES: 'page.notes',
  PAGE_MEMO: 'page.memo',
  FLOATING_BALL: 'floating-ball'
});

// 事件名
export const EVENTS = Object.freeze({
  PLUGIN_INSTALLED: 'plugin:installed',
  PLUGIN_ENABLED: 'plugin:enabled',
  PLUGIN_DISABLED: 'plugin:disabled',
  PLUGIN_UNINSTALLED: 'plugin:uninstalled',
  PLUGIN_UPDATED: 'plugin:updated',
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  NOTE_CREATED: 'note:created',
  NOTE_UPDATED: 'note:updated',
  NOTE_DELETED: 'note:deleted',
  NOTES_CHANGED: 'notes:changed',
  AI_INVOKED: 'ai:invoked',
  AI_RESULT: 'ai:result'
});

// 权限
export const PERMISSIONS = Object.freeze({
  NOTES_READ: 'notes:read',
  NOTES_WRITE: 'notes:write',
  NOTES_DELETE: 'notes:delete',
  CATEGORY_READ: 'category:read',
  CATEGORY_WRITE: 'category:write',
  TAG_READ: 'tag:read',
  TAG_WRITE: 'tag:write',
  PASSWORD_READ: 'password:read',
  PASSWORD_WRITE: 'password:write',
  AI_INVOKE: 'ai:invoke',
  AI_SUMMARIZE: 'ai:summarize',
  AI_CLASSIFY: 'ai:classify',
  AI_GENERATE: 'ai:generate',
  AI_EMBED: 'ai:embed',
  CRYPTO_ENCRYPT: 'crypto:encrypt',
  CRYPTO_DECRYPT: 'crypto:decrypt',
  NETWORK_EXTERNAL: 'network:external',
  STORAGE_READ: 'storage:read',
  STORAGE_WRITE: 'storage:write'
});

// 字典识别 — 时间关键词
export const TIME_KEYWORDS = {
  absolute: ['今天', '明天', '后天', '大后天', '下周', '下个月', '明年'],
  relative: ['待会', '一会儿', '等下', '稍后', '马上', '立即', '尽快'],
  time: ['早上', '上午', '中午', '下午', '晚上', '凌晨', '深夜'],
  period: ['周一', '周二', '周三', '周四', '周五', '周六', '周末', '周末'],
  date: ['号', '日', '月']
};

// 字典识别 — 动作词
export const ACTION_VERBS = {
  todo: ['买', '做', '写', '完成', '提交', '发送', '联系', '打电话', '回', '去', '处理', '准备', '安排', '预约'],
  note: ['想想', '思考', '考虑', '关于', '关于', '觉得', '认为', '感觉', '备忘', '记住'],
  question: ['为什么', '怎么', '如何', '什么', '哪些', '?', '？']
};

// 字典识别 — 优先级关键词
export const PRIORITY_KEYWORDS = {
  urgent: ['紧急', '!!', '！！！', '急', '马上', '立刻', 'ASAP'],
  high: ['重要', '优先', '!', '！', '高优'],
  medium: [],
  low: ['有空', '不急', '随便', '什么时候都行']
};
