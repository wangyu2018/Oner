/**
 * PluginContext — 插件上下文工厂
 *
 * 为每个插件创建独立的上下文对象
 * 包含：kernel（内核能力）、api（暴露给其他插件的API）、config（用户配置）
 */

import { EventBus } from './EventBus';
import { PluginRouter } from './PluginRouter';
import { PluginShell } from './PluginShell';
import { PluginCommandBar } from './PluginCommandBar';

export class PluginContextFactory {
  constructor({ eventBus, router, shell, commandbar }) {
    this._eventBus = eventBus;
    this._router = router;
    this._shell = shell;
    this._commandbar = commandbar;
    this._pluginAPIs = new Map(); // pluginId -> api object
  }

  /**
   * 创建插件上下文
   * @param {Object} pluginManifest - plugin.json 内容
   * @returns {Object} ctx
   */
  createContext(pluginManifest) {
    const pluginId = pluginManifest.id;

    // 创建该插件的 API 暴露对象
    const api = {};
    this._pluginAPIs.set(pluginId, api);

    // 构建 plugins 注册表代理（访问其他插件的 API）
    const pluginsProxy = new Proxy(
      {},
      {
        get: (target, prop) => {
          if (prop === pluginId) {
            return { api }; // 自己
          }
          const otherApi = this._pluginAPIs.get(prop);
          if (!otherApi) {
            console.warn(`[PluginContext] Plugin "${prop}" not found or not activated`);
            return { api: {} };
          }
          return { api: otherApi };
        },
      }
    );

    // 构建 ctx
    const ctx = {
      // 插件元数据
      plugin: {
        id: pluginId,
        name: pluginManifest.name,
        version: pluginManifest.version,
      },

      // 内核能力
      kernel: {
        router: this._createScopedRouter(pluginId),
        shell: this._createScopedShell(pluginId),
        commandbar: this._createScopedCommandBar(pluginId),
        eventBus: this._eventBus,
      },

      // 暴露给其他插件的 API
      api,

      // 访问其他插件的 API
      plugins: pluginsProxy,

      // 用户配置
      config: pluginManifest.config?.schema || {},
    };

    return ctx;
  }

  /**
   * 创建带 pluginId 标记的路由（方便批量移除）
   */
  _createScopedRouter(pluginId) {
    const router = this._router;
    return {
      addRoute: (config) => router.addRoute({ ...config, pluginId }),
      removeRoute: (path) => router.removeRoute(path),
      navigate: (path) => router.navigate(path),
    };
  }

  /**
   * 创建带 pluginId 标记的 Shell
   */
  _createScopedShell(pluginId) {
    const shell = this._shell;
    return {
      addSidebarItem: (item) => shell.addSidebarItem({ ...item, pluginId }),
      removeSidebarItem: (id) => shell.removeSidebarItem(id),
      addFloatingAction: (action) => shell.addFloatingAction({ ...action, pluginId }),
      removeFloatingAction: (id) => shell.removeFloatingAction(id),
      addToolbarItem: (item) => shell.addToolbarItem({ ...item, pluginId }),
      removeToolbarItem: (id) => shell.removeToolbarItem(id),
    };
  }

  /**
   * 创建带 pluginId 标记的 CommandBar
   */
  _createScopedCommandBar(pluginId) {
    const commandbar = this._commandbar;
    return {
      register: (cmd) => commandbar.register({ ...cmd, pluginId }),
      unregister: (id) => commandbar.unregister(id),
      execute: (id) => commandbar.execute(id),
      open: () => commandbar.open(),
    };
  }

  /**
   * 移除插件上下文（清理 API 引用）
   */
  removeContext(pluginId) {
    this._pluginAPIs.delete(pluginId);
  }

  /**
   * 获取所有已激活插件的 API
   */
  getAllPluginAPIs() {
    return Object.fromEntries(this._pluginAPIs);
  }
}

export default PluginContextFactory;
