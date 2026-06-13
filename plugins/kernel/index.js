/**
 * PluginManager — 插件生命周期管理器
 *
 * 职责：
 * 1. 加载插件清单（plugin.json）
 * 2. 按依赖顺序激活插件
 * 3. 管理插件状态（激活/停用/错误）
 * 4. 提供插件注册表查询
 */

import { EventBus } from './EventBus';
import { PluginRouter } from './PluginRouter';
import { PluginShell } from './PluginShell';
import { PluginCommandBar } from './PluginCommandBar';
import { PluginContextFactory } from './PluginContext';

export class PluginManager {
  constructor({ onRoutesChange, onUIChange, onCommandsChange, onPluginsChange }) {
    // 内核组件
    this.eventBus = new EventBus();
    this.router = new PluginRouter(onRoutesChange);
    this.shell = new PluginShell(onUIChange);
    this.commandbar = new PluginCommandBar(onCommandsChange);
    this.contextFactory = new PluginContextFactory({
      eventBus: this.eventBus,
      router: this.router,
      shell: this.shell,
      commandbar: this.commandbar,
    });

    // 插件注册表
    this._plugins = new Map(); // pluginId -> { manifest, ctx, status, module }
    this._onPluginsChange = onPluginsChange || (() => {});

    console.log('[PluginManager] Initialized');
  }

  /**
   * 注册插件（加载清单，但不激活）
   * @param {Object} manifest - plugin.json 内容
   * @param {Object} module - 插件模块（包含 activate/deactivate）
   */
  register(manifest, module) {
    const pluginId = manifest.id;

    if (this._plugins.has(pluginId)) {
      console.warn(`[PluginManager] Plugin "${pluginId}" already registered`);
      return;
    }

    this._plugins.set(pluginId, {
      manifest,
      module,
      ctx: null,
      status: 'registered', // registered | activating | active | deactivating | error
      error: null,
    });

    console.log(`[PluginManager] Plugin registered: ${pluginId} v${manifest.version}`);
    this._onPluginsChange(this.getPluginList());
  }

  /**
   * 激活插件
   */
  async activate(pluginId) {
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      console.error(`[PluginManager] Plugin "${pluginId}" not found`);
      return false;
    }

    if (plugin.status === 'active') {
      console.warn(`[PluginManager] Plugin "${pluginId}" already active`);
      return true;
    }

    try {
      plugin.status = 'activating';

      // 创建上下文
      plugin.ctx = this.contextFactory.createContext(plugin.manifest);

      // 调用插件的 activate 方法
      if (typeof plugin.module.activate === 'function') {
        await plugin.module.activate(plugin.ctx);
      }

      plugin.status = 'active';
      console.log(`[PluginManager] Plugin activated: ${pluginId}`);

      // 发送全局事件
      this.eventBus.emit('plugin:activated', { pluginId });
      this._onPluginsChange(this.getPluginList());

      return true;
    } catch (err) {
      plugin.status = 'error';
      plugin.error = err.message;
      console.error(`[PluginManager] Failed to activate "${pluginId}":`, err);
      this._onPluginsChange(this.getPluginList());
      return false;
    }
  }

  /**
   * 停用插件
   */
  async deactivate(pluginId) {
    const plugin = this._plugins.get(pluginId);
    if (!plugin || plugin.status !== 'active') {
      return false;
    }

    // 核心插件不可停用
    if (plugin.manifest.required) {
      console.warn(`[PluginManager] Cannot deactivate required plugin: ${pluginId}`);
      return false;
    }

    try {
      plugin.status = 'deactivating';

      // 调用插件的 deactivate 方法
      if (typeof plugin.module.deactivate === 'function') {
        await plugin.module.deactivate(plugin.ctx);
      }

      // 清理路由和 UI
      this.router.removePluginRoutes(pluginId);
      this.shell.removePluginUI(pluginId);
      this.commandbar.removePluginCommands(pluginId);
      this.contextFactory.removeContext(pluginId);

      plugin.status = 'registered';
      plugin.ctx = null;
      console.log(`[PluginManager] Plugin deactivated: ${pluginId}`);

      this.eventBus.emit('plugin:deactivated', { pluginId });
      this._onPluginsChange(this.getPluginList());

      return true;
    } catch (err) {
      plugin.status = 'error';
      plugin.error = err.message;
      console.error(`[PluginManager] Failed to deactivate "${pluginId}":`, err);
      return false;
    }
  }

  /**
   * 批量激活插件（按依赖顺序）
   */
  async activateAll(pluginIds) {
    const sorted = this._sortByDependencies(pluginIds);
    const results = {};

    for (const pluginId of sorted) {
      results[pluginId] = await this.activate(pluginId);
    }

    return results;
  }

  /**
   * 按依赖排序（简单拓扑排序）
   */
  _sortByDependencies(pluginIds) {
    const visited = new Set();
    const sorted = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const plugin = this._plugins.get(id);
      if (plugin?.manifest.dependencies) {
        for (const dep of plugin.manifest.dependencies) {
          visit(dep);
        }
      }
      sorted.push(id);
    };

    pluginIds.forEach(visit);
    return sorted;
  }

  /**
   * 获取插件列表
   */
  getPluginList() {
    return Array.from(this._plugins.entries()).map(([id, plugin]) => ({
      id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      type: plugin.manifest.type,
      required: plugin.manifest.required,
      status: plugin.status,
      error: plugin.error,
    }));
  }

  /**
   * 获取已激活插件
   */
  getActivePlugins() {
    return this.getPluginList().filter((p) => p.status === 'active');
  }

  /**
   * 检查插件是否已激活
   */
  isActive(pluginId) {
    const plugin = this._plugins.get(pluginId);
    return plugin?.status === 'active';
  }

  /**
   * 获取插件上下文
   */
  getPluginContext(pluginId) {
    return this._plugins.get(pluginId)?.ctx || null;
  }

  /**
   * 销毁所有插件（用于应用关闭）
   */
  async destroy() {
    const activePlugins = this.getPluginList()
      .filter((p) => p.status === 'active')
      .map((p) => p.id);

    // 按依赖逆序停用
    for (const pluginId of activePlugins.reverse()) {
      await this.deactivate(pluginId);
    }

    // 清空内核
    this.router.clear();
    this.shell.clear();
    this.commandbar.clear();
    this.eventBus.clear();
    this._plugins.clear();

    console.log('[PluginManager] Destroyed');
  }
}

export default PluginManager;
