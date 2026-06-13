/**
 * 后端插件加载器
 *
 * 职责：
 * 1. 扫描 plugins/ 目录下的 plugin.json
 * 2. 动态挂载 Express 路由
 * 3. 管理插件生命周期
 */

const fs = require('fs');
const path = require('path');

class BackendPluginLoader {
  constructor(app, db) {
    this.app = app;
    this.db = db;
    this.pluginsDir = path.join(__dirname, '../../plugins');
    this.loadedPlugins = new Map();
  }

  /**
   * 扫描并加载所有插件
   */
  async loadAll() {
    const pluginDirs = this._scanPluginDirs();
    console.log(`[PluginLoader] Found ${pluginDirs.length} plugin directories`);

    for (const pluginDir of pluginDirs) {
      try {
        await this.load(pluginDir);
      } catch (err) {
        console.error(`[PluginLoader] Failed to load plugin from ${pluginDir}:`, err.message);
      }
    }

    return this.loadedPlugins.size;
  }

  /**
   * 加载单个插件
   */
  async load(pluginDir) {
    const manifestPath = path.join(this.pluginsDir, pluginDir, 'plugin.json');

    if (!fs.existsSync(manifestPath)) {
      console.warn(`[PluginLoader] No plugin.json in ${pluginDir}`);
      return null;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const pluginId = manifest.id;

    if (this.loadedPlugins.has(pluginId)) {
      console.warn(`[PluginLoader] Plugin "${pluginId}" already loaded`);
      return manifest;
    }

    // 挂载后端路由
    if (manifest.backend?.routes) {
      this._mountRoutes(pluginDir, manifest.backend.routes);
    }

    // 执行数据库迁移
    if (manifest.backend?.migrations) {
      await this._runMigrations(pluginDir, manifest.backend.migrations);
    }

    // 调用安装钩子
    if (manifest.lifecycle?.install) {
      const installHook = this._loadModule(pluginDir, manifest.lifecycle.install);
      if (installHook && typeof installHook === 'function') {
        await installHook({ db: this.db });
      }
    }

    this.loadedPlugins.set(pluginId, {
      manifest,
      dir: pluginDir,
      status: 'active',
    });

    console.log(`[PluginLoader] Loaded: ${pluginId} v${manifest.version}`);
    return manifest;
  }

  /**
   * 卸载插件
   */
  async unload(pluginId) {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) return false;

    if (plugin.manifest.required) {
      console.warn(`[PluginLoader] Cannot unload required plugin: ${pluginId}`);
      return false;
    }

    // 调用卸载钩子
    if (plugin.manifest.lifecycle?.uninstall) {
      const uninstallHook = this._loadModule(plugin.dir, plugin.manifest.lifecycle.uninstall);
      if (uninstallHook && typeof uninstallHook === 'function') {
        await uninstallHook({ db: this.db });
      }
    }

    this.loadedPlugins.delete(pluginId);
    console.log(`[PluginLoader] Unloaded: ${pluginId}`);
    return true;
  }

  /**
   * 挂载路由
   */
  _mountRoutes(pluginDir, routes) {
    for (const routeConfig of routes) {
      const routePath = path.join(this.pluginsDir, pluginDir, routeConfig.file);

      if (!fs.existsSync(routePath)) {
        console.warn(`[PluginLoader] Route file not found: ${routePath}`);
        continue;
      }

      try {
        const router = require(routePath);
        if (typeof router === 'function') {
          this.app.use(routeConfig.path, router(this.db));
        } else if (router.router) {
          this.app.use(routeConfig.path, router.router);
        } else {
          this.app.use(routeConfig.path, router);
        }
        console.log(`[PluginLoader] Route mounted: ${routeConfig.path}`);
      } catch (err) {
        console.error(`[PluginLoader] Failed to mount route ${routeConfig.path}:`, err.message);
      }
    }
  }

  /**
   * 执行数据库迁移
   */
  async _runMigrations(pluginDir, migrations) {
    for (const migrationFile of migrations) {
      const migrationPath = path.join(this.pluginsDir, pluginDir, migrationFile);

      if (!fs.existsSync(migrationPath)) {
        console.warn(`[PluginLoader] Migration file not found: ${migrationPath}`);
        continue;
      }

      try {
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        this.db.exec(sql);
        console.log(`[PluginLoader] Migration executed: ${migrationFile}`);
      } catch (err) {
        // 忽略 "already exists" 错误
        if (!err.message.includes('already exists')) {
          console.error(`[PluginLoader] Migration failed: ${migrationFile}`, err.message);
        }
      }
    }
  }

  /**
   * 加载模块
   */
  _loadModule(pluginDir, modulePath) {
    const fullPath = path.join(this.pluginsDir, pluginDir, modulePath);
    if (!fs.existsSync(fullPath)) return null;
    try {
      return require(fullPath);
    } catch (err) {
      console.error(`[PluginLoader] Failed to load module ${modulePath}:`, err.message);
      return null;
    }
  }

  /**
   * 扫描插件目录
   */
  _scanPluginDirs() {
    if (!fs.existsSync(this.pluginsDir)) {
      return [];
    }

    return fs
      .readdirSync(this.pluginsDir)
      .filter((name) => {
        const fullPath = path.join(this.pluginsDir, name);
        return fs.statSync(fullPath).isDirectory() && name !== 'kernel';
      })
      .filter((name) => {
        const manifestPath = path.join(this.pluginsDir, name, 'plugin.json');
        return fs.existsSync(manifestPath);
      });
  }

  /**
   * 获取已加载插件列表
   */
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.entries()).map(([id, plugin]) => ({
      id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      type: plugin.manifest.type,
      required: plugin.manifest.required,
      status: plugin.status,
    }));
  }
}

module.exports = BackendPluginLoader;
