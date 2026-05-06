import { getDb } from './index.js';

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
  const db = getDb();
  const [normalizedSql, normalizedParams] = normalizeParams(sql, params);
  const stmt = db.prepare(normalizedSql);
  return stmt.all(normalizedParams);
}

/**
 * 查询单条记录
 */
export function queryOne(sql, params = []) {
  const db = getDb();
  const [normalizedSql, normalizedParams] = normalizeParams(sql, params);
  const stmt = db.prepare(normalizedSql);
  return stmt.get(normalizedParams) || null;
}

/**
 * 执行写入操作（INSERT/UPDATE/DELETE）
 */
export function runQuery(sql, params = []) {
  const db = getDb();
  const [normalizedSql, normalizedParams] = normalizeParams(sql, params);
  const stmt = db.prepare(normalizedSql);
  return stmt.run(normalizedParams);
}
