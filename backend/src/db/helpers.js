import { getDb } from './index.js';

// ========================================
// Prepared Statement 缓存池（LRU）
// 避免每次查询重新编译 SQL（VDBE 编译开销大）
// ========================================
const stmtCache = new Map(); // normalizedSql -> prepared statement
const MAX_CACHE_SIZE = 200;

/**
 * 获取缓存的 Prepared Statement，不存在时创建并缓存
 * 使用简易 LRU 策略：命中时移到末尾，满时淘汰最早的
 */
function getStmt(sql) {
  if (stmtCache.has(sql)) {
    const stmt = stmtCache.get(sql);
    // 移到最近使用位置
    stmtCache.delete(sql);
    stmtCache.set(sql, stmt);
    return stmt;
  }
  // 缓存满时淘汰最早的
  if (stmtCache.size >= MAX_CACHE_SIZE) {
    const firstKey = stmtCache.keys().next().value;
    stmtCache.delete(firstKey);
  }
  const stmt = getDb().prepare(sql);
  stmtCache.set(sql, stmt);
  return stmt;
}

/**
 * 清除 Statement 缓存（数据库结构变更后调用）
 */
export function clearStmtCache() {
  stmtCache.clear();
}

/**
 * 将数组参数转换为 node:sqlite 支持的对象参数
 * node:sqlite 不支持 `?` 数组参数，需要转换为 `@p1, @p2` 对象参数
 */
function normalizeParams(sql, params) {
  if (!params || params.length === 0) {
    return [sql, params];
  }
  if (!sql.includes('?')) {
    return [sql, params];
  }
  const namedParams = {};
  let index = 0;
  const convertedSql = sql.replace(/\?/g, () => {
    index++;
    namedParams[`@p${index}`] = params[index - 1];
    return `@p${index}`;
  });
  return [convertedSql, namedParams];
}

/**
 * 查询多条记录
 */
export function queryAll(sql, params = []) {
  const [normalizedSql, normalizedParams] = normalizeParams(sql, params);
  const stmt = getStmt(normalizedSql);
  return stmt.all(normalizedParams);
}

/**
 * 查询单条记录
 */
export function queryOne(sql, params = []) {
  const [normalizedSql, normalizedParams] = normalizeParams(sql, params);
  const stmt = getStmt(normalizedSql);
  return stmt.get(normalizedParams) || null;
}

/**
 * 执行写入操作（INSERT/UPDATE/DELETE）
 */
export function runQuery(sql, params = []) {
  const [normalizedSql, normalizedParams] = normalizeParams(sql, params);
  const stmt = getStmt(normalizedSql);
  return stmt.run(normalizedParams);
}
