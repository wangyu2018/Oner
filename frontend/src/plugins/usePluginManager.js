/**
 * usePluginManager — React Hook for Plugin System
 *
 * 在 React 组件中使用插件系统
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PluginManager } from './kernel/index.js';

// 全局单例
let pluginManagerInstance = null;

export function usePluginManager() {
  const [routes, setRoutes] = useState([]);
  const [sidebarItems, setSidebarItems] = useState([]);
  const [floatingActions, setFloatingActions] = useState([]);
  const [commands, setCommands] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const managerRef = useRef(null);

  // 初始化 PluginManager
  useEffect(() => {
    if (managerRef.current) return;

    const manager = new PluginManager({
      onRoutesChange: setRoutes,
      onUIChange: (type, items) => {
        if (type === 'sidebar' || type === 'all') setSidebarItems(manager.shell.getSidebarItems());
        if (type === 'floating' || type === 'all') setFloatingActions(manager.shell.getFloatingActions());
      },
      onCommandsChange: setCommands,
      onPluginsChange: setPlugins,
    });

    managerRef.current = manager;
    pluginManagerInstance = manager;

    // 加载并激活所有插件
    loadPlugins(manager).then(() => {
      setIsReady(true);
    });

    return () => {
      manager.destroy();
      pluginManagerInstance = null;
    };
  }, []);

  const registerPlugin = useCallback(async (manifest, module) => {
    if (!managerRef.current) return;
    managerRef.current.register(manifest, module);
    await managerRef.current.activate(manifest.id);
  }, []);

  const deactivatePlugin = useCallback(async (pluginId) => {
    if (!managerRef.current) return;
    await managerRef.current.deactivate(pluginId);
  }, []);

  return {
    pluginManager: managerRef.current,
    routes,
    sidebarItems,
    floatingActions,
    commands,
    plugins,
    isReady,
    registerPlugin,
    deactivatePlugin,
  };
}

/**
 * 获取全局 PluginManager 实例
 */
export function getPluginManager() {
  return pluginManagerInstance;
}

/**
 * 加载所有插件
 */
async function loadPlugins(manager) {
  // 动态导入插件（Vite 支持）
  const pluginModules = [
    {
      manifest: () => import('./oner-plugin-core-notes/plugin.json'),
      module: () => import('./oner-plugin-core-notes/frontend/index.jsx'),
    },
    {
      manifest: () => import('./oner-plugin-ai/plugin.json'),
      module: () => import('./oner-plugin-ai/frontend/index.jsx'),
    },
    {
      manifest: () => import('./oner-plugin-password/plugin.json'),
      module: () => import('./oner-plugin-password/frontend/index.jsx'),
    },
    {
      manifest: () => import('./oner-plugin-kanban/plugin.json'),
      module: () => import('./oner-plugin-kanban/frontend/index.jsx'),
    },
  ];

  // 注册所有插件
  for (const pluginDef of pluginModules) {
    try {
      const [manifest, module] = await Promise.all([pluginDef.manifest(), pluginDef.module()]);
      manager.register(manifest.default || manifest, module.default || module);
    } catch (err) {
      console.warn('[usePluginManager] Failed to load plugin:', err);
    }
  }

  // 读取持久化的禁用列表，跳过已停用的插件
  const disabledPlugins = (() => {
    try {
      const raw = localStorage.getItem('oner_disabled_plugins');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  })();

  // 按依赖顺序激活（跳过已停用的）
  const pluginIds = ['oner.plugin.core-notes', 'oner.plugin.ai', 'oner.plugin.password', 'oner.plugin.kanban'];
  await manager.activateAll(
    pluginIds.filter((id) => !manager.isActive(id) && !disabledPlugins.includes(id))
  );
}

export default usePluginManager;
