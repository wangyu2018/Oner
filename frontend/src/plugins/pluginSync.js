/**
 * pluginSync.js — 多端插件同步核心模块
 *
 * 启动流程：
 *  1. 检查 localStorage 'oner_plugins_migrated' 标记
 *     无标记 → POST /sync/batch 上传 disabled 列表 → 标记完成
 *  2. GET /plugins/sync 拉取服务端状态
 *  3. Reconcile：后端为权威（安装/启用状态以后端为准）
 *  4. 返回 disabled 列表供 loadPlugins 使用
 *  网络失败 → 降级为 localStorage 模式（不阻塞启动）
 */

import { api } from '../utils/api.js';

const BUILTIN_PLUGINS = [
  'oner.plugin.core-notes',
  'oner.plugin.ai',
  'oner.plugin.password',
  'oner.plugin.kanban',
  'oner.plugin.memo',
];

/**
 * 从 localStorage 读取当前的禁用列表
 */
function getLocalDisabledPlugins() {
  try {
    const raw = localStorage.getItem('oner_disabled_plugins');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 将禁用列表写回 localStorage（同步后保持一致）
 */
function setLocalDisabledPlugins(disabledIds) {
  try {
    localStorage.setItem('oner_disabled_plugins', JSON.stringify(disabledIds));
  } catch {
    // ignore
  }
}

/**
 * 步骤 1：首次迁移 localStorage → DB
 */
async function migrateIfNeeded() {
  const migrated = localStorage.getItem('oner_plugins_migrated');
  if (migrated) return; // 已迁移

  const disabledIds = getLocalDisabledPlugins();
  try {
    await api.plugins.batchSync(disabledIds);
    localStorage.setItem('oner_plugins_migrated', '1');
    console.log('[PluginSync] localStorage → DB migration complete');
  } catch (err) {
    console.warn('[PluginSync] migration failed, will retry next startup:', err.message);
  }
}

/**
 * 步骤 2+3：拉取服务端状态并 reconcile
 * @returns {string[]} 应被禁用的插件 ID 列表
 */
async function fetchAndReconcile() {
  const res = await api.plugins.sync();
  const serverPlugins = res?.data?.plugins || [];

  const disabledIds = [];

  for (const sp of serverPlugins) {
    // 只处理内置插件的 enabled/disabled
    if (!BUILTIN_PLUGINS.includes(sp.plugin_id)) continue;

    // required 插件始终启用
    if (sp.required) continue;

    // 后端 wins：enabled 状态以后端为准
    if (!sp.enabled) {
      disabledIds.push(sp.plugin_id);
    }
  }

  // 同步回 localStorage（保持一致，供离线降级使用）
  setLocalDisabledPlugins(disabledIds);

  return disabledIds;
}

/**
 * 主入口：启动时调用，返回最终应禁用的插件列表
 * @returns {Promise<string[]>} disabled plugin IDs
 */
export async function syncPluginsOnStartup() {
  // 步骤 1：首次迁移
  await migrateIfNeeded();

  // 步骤 2+3：拉取 + reconcile
  try {
    const disabledIds = await fetchAndReconcile();
    console.log('[PluginSync] sync complete, disabled:', disabledIds);
    return disabledIds;
  } catch (err) {
    // 网络失败 → 降级 localStorage
    console.warn('[PluginSync] sync failed, falling back to localStorage:', err.message);
    return getLocalDisabledPlugins();
  }
}

/**
 * 切换插件启用/禁用（供 UI 调用）
 */
export async function togglePlugin(pluginId, enabled) {
  try {
    await api.plugins.toggle(pluginId, enabled);
    // 同步更新 localStorage
    const disabledIds = getLocalDisabledPlugins();
    if (enabled) {
      setLocalDisabledPlugins(disabledIds.filter(id => id !== pluginId));
    } else {
      if (!disabledIds.includes(pluginId)) {
        setLocalDisabledPlugins([...disabledIds, pluginId]);
      }
    }
  } catch (err) {
    throw new Error(`切换插件失败: ${err.message}`);
  }
}
