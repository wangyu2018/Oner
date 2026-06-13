/**
 * Frontend PluginManager — 前端插件管理器
 *
 * 职责：
 * - 发现 plugins/ 目录下的所有插件
 * - 加载并激活已启用的插件
 * - 提供 ctx（插件上下文）给每个插件
 * - 支持热加载（开发模式）
 * - 暴露 API 给 App.jsx 使用
 */

import { EVENTS } from '../../../plugins/_shared/constants';

class FrontendPluginManager {
  constructor() {
    this.plugins = new Map();        // id -> { manifest, instance, status }
    this.ctxMap = new Map();         // id -> ctx
    this.eventBus = this._createEventBus();
    this.router = this._createRouterProxy();
    this.shell = this._createShellProxy();
    this.commandbar = this._createCommandbarProxy();
    this.api = {};                   // 跨插件 API 命名空间
  }

  /**
   * 启动插件系统
   * - 加载 plugins/ 目录
   * - 激活已启用的插件
   */
  async bootstrap() {
    console.log('[PluginManager] bootstrapping...');

    // 1. 扫描 plugins/ 目录（开发时用 import.meta.glob）
    const manifests = await this._discoverPlugins();

    // 2. 加载所有已安装的插件配置
    const enabled = await this._loadEnabledPlugins();

    // 3. 按依赖顺序激活
    const ordered = this._topologicalSort(manifests, enabled);

    for (const id of ordered) {
      const manifest = manifests.get(id);
      if (enabled.has(id) || manifest.required) {
        try {
          await this._activate(id, manifest);
        } catch (err) {
          console.error(`[PluginManager] failed to activate ${id}:`, err);
        }
      }
    }

    console.log(`[PluginManager] ${this.plugins.size} plugins activated`);
  }

  /**
   * 激活单个插件
   */
  async _activate(id, manifest) {
    if (this.plugins.has(id)) {
      console.warn(`[PluginManager] ${id} already activated`);
      return;
    }

    // 动态 import（支持 Vite 的 import.meta.glob）
    const module = await import(/* @vite-ignore */ manifest.frontend.entry);
    const instance = module.default;

    // 构建 ctx
    const ctx = {
      pluginId: id,
      kernel: {
        router: this.router,
        shell: this.shell,
        commandbar: this.commandbar,
        eventBus: this.eventBus,
        storage: this._createStorageProxy(id)
      },
      config: await this._loadPluginConfig(id, manifest),
      api: this.api  // 跨插件 API 命名空间
    };

    // 调用 activate
    await instance.activate(ctx);

    this.plugins.set(id, {
      manifest,
      instance,
      status: 'enabled',
      ctx
    });

    this.eventBus.emit(EVENTS.PLUGIN_ENABLED, { id, manifest });
  }

  /**
   * 停用插件
   */
  async deactivate(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return;

    if (plugin.manifest.required) {
      throw new Error(`Cannot deactivate required plugin: ${id}`);
    }

    await plugin.instance.deactivate(plugin.ctx);
    this.plugins.delete(id);
    this.eventBus.emit(EVENTS.PLUGIN_DISABLED, { id });
  }

  /**
   * 热加载（开发模式）
   */
  async hotReload(id) {
    console.log(`[PluginManager] hot-reloading ${id}...`);
    await this.deactivate(id);
    const manifest = (await this._discoverPlugins()).get(id);
    if (manifest) {
      await this._activate(id, manifest);
    }
  }

  /**
   * 获取已激活的插件清单
   */
  list() {
    return Array.from(this.plugins.entries()).map(([id, p]) => ({
      id,
      name: p.manifest.name,
      version: p.manifest.version,
      status: p.status,
      icon: p.manifest.icon
    }));
  }

  // ===== 内部方法 =====

  async _discoverPlugins() {
    // Vite 环境：使用 import.meta.glob 扫描 plugins/ 目录
    // 实际项目中可以从这里替换成后端 API 调用
    const modules = import.meta.glob('/plugins/oner-plugin-*/plugin.json', { eager: true });
    const manifests = new Map();
    for (const [path, mod] of Object.entries(modules)) {
      const id = mod.default.id;
      manifests.set(id, mod.default);
    }
    return manifests;
  }

  async _loadEnabledPlugins() {
    const saved = localStorage.getItem('oner:enabled-plugins');
    return new Set(saved ? JSON.parse(saved) : []);
  }

  _topologicalSort(manifests, enabled) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (id) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected: ${id}`);
      }
      visiting.add(id);

      const manifest = manifests.get(id);
      if (manifest) {
        for (const dep of manifest.dependencies || []) {
          if (manifests.has(dep.id)) visit(dep.id);
        }
      }

      visiting.delete(id);
      visited.add(id);
      sorted.push(id);
    };

    for (const id of manifests.keys()) visit(id);
    return sorted;
  }

  async _loadPluginConfig(id, manifest) {
    const saved = localStorage.getItem(`oner:plugin-config:${id}`);
    const cfg = saved ? JSON.parse(saved) : {};
    // 应用默认值
    const config = {};
    for (const [key, schema] of Object.entries(manifest.config?.schema || {})) {
      config[key] = cfg[key] !== undefined ? cfg[key] : schema.default;
    }
    return config;
  }

  _createEventBus() {
    const listeners = new Map();
    return {
      on(event, callback) {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(callback);
        return () => this.off(event, callback);
      },
      off(event, callback) {
        const arr = listeners.get(event) || [];
        const idx = arr.indexOf(callback);
        if (idx >= 0) arr.splice(idx, 1);
      },
      emit(event, data) {
        (listeners.get(event) || []).forEach(cb => cb(data));
      }
    };
  }

  _createRouterProxy() {
    // 实际项目中这里指向 react-router 的 router 实例
    const routes = [];
    return {
      addRoute(route) { routes.push(route); },
      removeRoute(path) {
        const idx = routes.findIndex(r => r.path === path);
        if (idx >= 0) routes.splice(idx, 1);
      },
      navigate(path) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); },
      getRoutes() { return routes; }
    };
  }

  _createShellProxy() {
    const sidebar = [];
    return {
      addSidebarItem(item) { sidebar.push(item); },
      removeSidebarItem(id) {
        const idx = sidebar.findIndex(s => s.id === id);
        if (idx >= 0) sidebar.splice(idx, 1);
      },
      getSidebar() { return [...sidebar]; }
    };
  }

  _createCommandbarProxy() {
    const commands = new Map();
    return {
      register(cmd) { commands.set(cmd.id, cmd); },
      unregister(id) { commands.delete(id); },
      open() { /* trigger UI */ },
      getCommands() { return Array.from(commands.values()); }
    };
  }

  _createStorageProxy(pluginId) {
    const prefix = `oner:plugin:${pluginId}:`;
    return {
      get(key) {
        const v = localStorage.getItem(prefix + key);
        return v ? JSON.parse(v) : null;
      },
      set(key, value) {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      },
      remove(key) { localStorage.removeItem(prefix + key); },
      clear() {
        Object.keys(localStorage)
          .filter(k => k.startsWith(prefix))
          .forEach(k => localStorage.removeItem(k));
      }
    };
  }
}

export const pluginManager = new FrontendPluginManager();
export default pluginManager;
