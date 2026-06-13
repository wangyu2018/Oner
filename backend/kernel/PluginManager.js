/**
 * Backend PluginManager — 后端插件管理器
 *
 * 职责：
 * - 扫描 plugins/ 目录
 * - 注册插件的路由到 Express
 * - 执行数据库迁移
 * - 提供插件间共享能力
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class BackendPluginManager {
  constructor(app, db) {
    this.app = app;
    this.db = db;
    this.plugins = new Map();
    this.shared = {
      // 跨插件共享的能力
      eventBus: this._createEventBus(),
      logger: console
    };
  }

  /**
   * 扫描并注册所有插件
   */
  async bootstrap() {
    console.log('[Backend PluginManager] bootstrapping...');
    const pluginsDir = path.join(__dirname, '../../../plugins');
    const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
    const manifests = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name === 'node_modules') continue;
      const manifestPath = path.join(pluginsDir, entry.name, 'plugin.json');
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
        manifests.push(manifest);
      } catch (err) {
        console.error(`[PluginManager] failed to read ${manifestPath}:`, err.message);
      }
    }

    // 按依赖顺序加载
    const ordered = this._topologicalSort(manifests);
    for (const manifest of ordered) {
      try {
        await this._loadPlugin(manifest);
      } catch (err) {
        console.error(`[PluginManager] failed to load ${manifest.id}:`, err.message);
      }
    }

    console.log(`[Backend PluginManager] ${this.plugins.size} plugins loaded`);
  }

  async _loadPlugin(manifest) {
    const entry = manifest.backend?.entry;
    if (!entry) {
      console.warn(`[PluginManager] ${manifest.id} has no backend entry, skipping`);
      return;
    }

    // 动态 require
    const modulePath = path.join(__dirname, '../../../plugins', manifest.id, entry);
    delete require.cache[modulePath];
    const module = require(modulePath);

    // 注册路由
    for (const route of manifest.backend.routes || []) {
      const routePath = path.join(__dirname, '../../../plugins', manifest.id, route.file);
      delete require.cache[routePath];
      const handler = require(routePath);
      this.app.use(route.path, handler);
      console.log(`[PluginManager] registered route: ${route.path}`);
    }

    // 执行数据库迁移
    for (const migration of manifest.backend.migrations || []) {
      const migrationPath = path.join(__dirname, '../../../plugins', manifest.id, migration);
      try {
        const sql = await fs.readFile(migrationPath, 'utf8');
        await this.db.exec(sql);
        console.log(`[PluginManager] migration applied: ${migration}`);
      } catch (err) {
        console.error(`[PluginManager] migration failed: ${migration}`, err.message);
      }
    }

    // 调用插件入口
    if (module.default?.activate) {
      const ctx = {
        pluginId: manifest.id,
        db: this.db,
        shared: this.shared,
        manifest
      };
      await module.default.activate(ctx);
    }

    this.plugins.set(manifest.id, { manifest, module });
  }

  _topologicalSort(manifests) {
    const map = new Map(manifests.map(m => [m.id, m]));
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (m) => {
      if (visited.has(m.id)) return;
      if (visiting.has(m.id)) throw new Error(`Circular: ${m.id}`);
      visiting.add(m.id);
      for (const dep of m.dependencies || []) {
        const depManifest = map.get(dep.id);
        if (depManifest) visit(depManifest);
      }
      visiting.delete(m.id);
      visited.add(m.id);
      sorted.push(m);
    };

    manifests.forEach(visit);
    return sorted;
  }

  _createEventBus() {
    const listeners = new Map();
    return {
      on(event, callback) {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(callback);
      },
      emit(event, data) {
        (listeners.get(event) || []).forEach(cb => cb(data));
      }
    };
  }

  list() {
    return Array.from(this.plugins.entries()).map(([id, p]) => ({
      id,
      name: p.manifest.name,
      version: p.manifest.version
    }));
  }
}

module.exports = BackendPluginManager;
