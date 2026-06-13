/**
 * PluginRouter — 动态路由管理
 *
 * 为插件提供动态注册/移除路由的能力
 * 与 React Router 集成，通过 state 变化触发重渲染
 */
export class PluginRouter {
  constructor(onRoutesChange) {
    this._routes = new Map();
    this._onRoutesChange = onRoutesChange || (() => {});
  }

  /**
   * 注册路由
   * @param {Object} routeConfig
   * @param {string} routeConfig.path - 路由路径
   * @param {React.Component|Function} routeConfig.component - 页面组件
   * @param {boolean} [routeConfig.exact=false] - 是否精确匹配
   * @param {string} [routeConfig.pluginId] - 所属插件ID
   */
  addRoute(routeConfig) {
    const { path, component, exact = false, pluginId } = routeConfig;
    this._routes.set(path, { path, component, exact, pluginId });
    this._onRoutesChange(this.getRoutes());
    console.log(`[Router] Route added: ${path}`);
  }

  /**
   * 移除路由
   */
  removeRoute(path) {
    if (this._routes.has(path)) {
      this._routes.delete(path);
      this._onRoutesChange(this.getRoutes());
      console.log(`[Router] Route removed: ${path}`);
    }
  }

  /**
   * 移除插件的所有路由
   */
  removePluginRoutes(pluginId) {
    const pathsToRemove = [];
    this._routes.forEach((route, path) => {
      if (route.pluginId === pluginId) {
        pathsToRemove.push(path);
      }
    });
    pathsToRemove.forEach((path) => this._routes.delete(path));
    if (pathsToRemove.length > 0) {
      this._onRoutesChange(this.getRoutes());
      console.log(`[Router] Removed ${pathsToRemove.length} routes for plugin: ${pluginId}`);
    }
  }

  /**
   * 获取所有路由
   */
  getRoutes() {
    return Array.from(this._routes.values());
  }

  /**
   * 导航（触发路由变化）
   */
  navigate(path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  /**
   * 清空所有路由
   */
  clear() {
    this._routes.clear();
    this._onRoutesChange(this.getRoutes());
  }
}

export default PluginRouter;
