/**
 * PluginShell — UI Shell 管理
 *
 * 管理侧边栏、浮动按钮、顶部工具栏等 UI 插槽
 * 插件通过 ctx.kernel.shell 注入 UI 元素
 */
export class PluginShell {
  constructor(onUIChange) {
    this._sidebarItems = new Map();
    this._floatingActions = new Map();
    this._toolbarItems = new Map();
    this._onUIChange = onUIChange || (() => {});
  }

  // ============ 侧边栏 ============

  /**
   * 添加侧边栏项
   * @param {Object} item
   * @param {string} item.id - 唯一ID
   * @param {string} item.label - 显示文本
   * @param {string} item.icon - lucide-react 图标名
   * @param {string} item.path - 路由路径
   * @param {number} [item.priority=0] - 排序优先级（越大越靠前）
   * @param {string} [item.slot='sidebar.main'] - 插槽位置
   */
  addSidebarItem(item) {
    this._sidebarItems.set(item.id, { ...item, priority: item.priority || 0 });
    this._onUIChange('sidebar', this.getSidebarItems());
  }

  /**
   * 移除侧边栏项
   */
  removeSidebarItem(id) {
    this._sidebarItems.delete(id);
    this._onUIChange('sidebar', this.getSidebarItems());
  }

  /**
   * 获取侧边栏项（按优先级排序）
   */
  getSidebarItems() {
    return Array.from(this._sidebarItems.values()).sort((a, b) => b.priority - a.priority);
  }

  // ============ 浮动操作按钮 ============

  /**
   * 添加浮动操作按钮
   * @param {Object} action
   * @param {string} action.id - 唯一ID
   * @param {string} action.icon - 图标
   * @param {string} action.label - 提示文本
   * @param {Function} action.handler - 点击处理
   * @param {string} [action.position='bottom-right'] - 位置
   */
  addFloatingAction(action) {
    this._floatingActions.set(action.id, { ...action, position: action.position || 'bottom-right' });
    this._onUIChange('floating', this.getFloatingActions());
  }

  /**
   * 移除浮动操作按钮
   */
  removeFloatingAction(id) {
    this._floatingActions.delete(id);
    this._onUIChange('floating', this.getFloatingActions());
  }

  /**
   * 获取浮动操作按钮
   */
  getFloatingActions(position = 'bottom-right') {
    return Array.from(this._floatingActions.values()).filter((a) => a.position === position);
  }

  // ============ 工具栏 ============

  /**
   * 添加工具栏按钮
   */
  addToolbarItem(item) {
    this._toolbarItems.set(item.id, { ...item, priority: item.priority || 0 });
    this._onUIChange('toolbar', this.getToolbarItems());
  }

  /**
   * 移除工具栏按钮
   */
  removeToolbarItem(id) {
    this._toolbarItems.delete(id);
    this._onUIChange('toolbar', this.getToolbarItems());
  }

  /**
   * 获取工具栏按钮
   */
  getToolbarItems() {
    return Array.from(this._toolbarItems.values()).sort((a, b) => b.priority - a.priority);
  }

  // ============ 通用 ============

  /**
   * 清空指定插件的所有 UI 元素
   */
  removePluginUI(pluginId) {
    const cleanup = (map) => {
      const idsToRemove = [];
      map.forEach((item, id) => {
        if (item.pluginId === pluginId) idsToRemove.push(id);
      });
      idsToRemove.forEach((id) => map.delete(id));
    };

    cleanup(this._sidebarItems);
    cleanup(this._floatingActions);
    cleanup(this._toolbarItems);
    this._onUIChange('all', null);
  }

  /**
   * 清空所有
   */
  clear() {
    this._sidebarItems.clear();
    this._floatingActions.clear();
    this._toolbarItems.clear();
    this._onUIChange('all', null);
  }
}

export default PluginShell;
