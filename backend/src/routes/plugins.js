/**
 * 插件市场 API 路由
 *
 * GET    /marketplace       — 浏览可用插件
 * GET    /marketplace/:id   — 插件详情
 * POST   /install           — 安装插件
 * DELETE /:id               — 卸载插件
 * POST   /:id/reload        — 热重载插件
 * GET    /installed         — 已安装插件列表
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import semver from 'semver';
import AdmZip from 'adm-zip';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function createPluginsRouter(pluginLoader) {
  const router = Router();
  router.use(authMiddleware);

  const registryPath = path.join(__dirname, '../../plugins/registry.json');

  // ---------- 读取注册表 ----------
  function loadRegistry() {
    try {
      if (!fs.existsSync(registryPath)) return [];
      return JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  // ---------- 保存注册表（更新 downloads 等） ----------
  function saveRegistry(data) {
    fs.writeFileSync(registryPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ---------- GET /marketplace — 浏览市场 ----------
  router.get('/marketplace', (req, res) => {
    try {
      const registry = loadRegistry();
      const installed = new Set(pluginLoader.getInstalled().map(p => p.id));
      const { tag, q } = req.query;

      let plugins = registry.map(p => ({
        ...p,
        installed: installed.has(p.id),
      }));

      // 按标签过滤
      if (tag) {
        plugins = plugins.filter(p => (p.tags || []).includes(tag));
      }

      // 按关键词搜索
      if (q) {
        const lower = q.toLowerCase();
        plugins = plugins.filter(p =>
          p.name.toLowerCase().includes(lower) ||
          (p.description || '').toLowerCase().includes(lower)
        );
      }

      res.json({ success: true, data: { plugins } });
    } catch (err) {
      console.error('[Plugins] marketplace error:', err);
      res.status(500).json({ success: false, error: '获取插件市场列表失败', code: 500 });
    }
  });

  // ---------- GET /marketplace/:id — 插件详情 ----------
  router.get('/marketplace/:id', (req, res) => {
    try {
      const registry = loadRegistry();
      const plugin = registry.find(p => p.id === req.params.id);
      if (!plugin) {
        return res.status(404).json({ success: false, error: '插件不存在', code: 404 });
      }

      const installed = pluginLoader.getPlugin(plugin.id);

      res.json({
        success: true,
        data: {
          ...plugin,
          installed: !!installed,
          installedVersion: installed?.version || null,
        }
      });
    } catch (err) {
      console.error('[Plugins] marketplace detail error:', err);
      res.status(500).json({ success: false, error: '获取插件详情失败', code: 500 });
    }
  });

  // ---------- GET /installed — 已安装插件 ----------
  router.get('/installed', (req, res) => {
    try {
      const plugins = pluginLoader.getInstalled();
      res.json({ success: true, data: { plugins } });
    } catch (err) {
      console.error('[Plugins] installed list error:', err);
      res.status(500).json({ success: false, error: '获取已安装插件失败', code: 500 });
    }
  });

  // ---------- POST /install — 安装插件 ----------
  router.post('/install', async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: '缺少插件 id', code: 400 });
      }

      // 检查是否已安装
      if (pluginLoader.getPlugin(id)) {
        return res.status(400).json({ success: false, error: '插件已安装', code: 400 });
      }

      // 查找注册表
      const registry = loadRegistry();
      const entry = registry.find(p => p.id === id);
      if (!entry) {
        return res.status(404).json({ success: false, error: '插件不在市场注册表中', code: 404 });
      }

      // 版本兼容性检查
      const appVersion = '1.3.0'; // TODO: 从 package.json 读取
      if (entry.minAppVersion && semver.lt(appVersion, entry.minAppVersion)) {
        return res.status(400).json({
          success: false,
          error: `需要应用版本 >= ${entry.minAppVersion}，当前 ${appVersion}`,
          code: 400,
        });
      }

      const pluginsDir = path.join(__dirname, '../../plugins');
      const pluginDirName = id.replace('oner.plugin.', '');
      const targetDir = path.join(pluginsDir, pluginDirName);

      if (entry.downloadUrl) {
        // 远程安装：下载 zip → 解压
        console.log(`[Plugins] Downloading ${id} from ${entry.downloadUrl}...`);

        const response = await fetch(entry.downloadUrl);
        if (!response.ok) {
          return res.status(502).json({ success: false, error: '下载失败', code: 502 });
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const zip = new AdmZip(buffer);

        // 确保目标目录存在
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        zip.extractAllTo(targetDir, true);
        console.log(`[Plugins] Extracted to ${targetDir}`);
      } else {
        // 本地安装：检查目录是否存在
        if (!fs.existsSync(path.join(targetDir, 'plugin.json'))) {
          return res.status(400).json({
            success: false,
            error: '插件目录不存在或无 plugin.json，请手动放置到 plugins/ 目录',
            code: 400,
          });
        }
      }

      // 加载插件
      const manifest = await pluginLoader.load(pluginDirName);
      if (!manifest) {
        return res.status(500).json({ success: false, error: '插件加载失败', code: 500 });
      }

      // 更新注册表 downloads 计数
      const regIdx = registry.findIndex(p => p.id === id);
      if (regIdx >= 0) {
        registry[regIdx].downloads = (registry[regIdx].downloads || 0) + 1;
        saveRegistry(registry);
      }

      res.json({
        success: true,
        data: {
          message: `插件 "${entry.name}" 安装成功`,
          plugin: pluginLoader.getPlugin(id),
        }
      });
    } catch (err) {
      console.error('[Plugins] install error:', err);
      res.status(500).json({ success: false, error: '安装失败: ' + err.message, code: 500 });
    }
  });

  // ---------- DELETE /:id — 卸载插件 ----------
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const plugin = pluginLoader.getPlugin(id);

      if (!plugin) {
        return res.status(404).json({ success: false, error: '插件未安装', code: 404 });
      }

      if (plugin.required) {
        return res.status(400).json({ success: false, error: '核心插件不可卸载', code: 400 });
      }

      const result = await pluginLoader.unload(id);
      if (!result) {
        return res.status(500).json({ success: false, error: '卸载失败', code: 500 });
      }

      res.json({
        success: true,
        data: { message: `插件 "${plugin.name}" 已卸载` }
      });
    } catch (err) {
      console.error('[Plugins] uninstall error:', err);
      res.status(500).json({ success: false, error: '卸载失败: ' + err.message, code: 500 });
    }
  });

  // ---------- POST /:id/reload — 热重载插件 ----------
  router.post('/:id/reload', async (req, res) => {
    try {
      const { id } = req.params;
      const plugin = pluginLoader.getPlugin(id);

      if (!plugin) {
        return res.status(404).json({ success: false, error: '插件未安装', code: 404 });
      }

      const success = await pluginLoader.reload(id);
      if (!success) {
        return res.status(500).json({ success: false, error: '热重载失败', code: 500 });
      }

      res.json({
        success: true,
        data: {
          message: `插件 "${plugin.name}" 已热重载`,
          plugin: pluginLoader.getPlugin(id),
        }
      });
    } catch (err) {
      console.error('[Plugins] reload error:', err);
      res.status(500).json({ success: false, error: '热重载失败: ' + err.message, code: 500 });
    }
  });

  return router;
}
