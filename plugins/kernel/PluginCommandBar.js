/**
 * PluginCommandBar — 命令栏注册中心
 *
 * 管理全局命令面板（Ctrl+K）的快捷命令
 * 插件通过 ctx.kernel.commandbar 注册命令
 */
export class PluginCommandBar {
  constructor(onCommandsChange) {
    this._commands = new Map();
    this._onCommandsChange = onCommandsChange || (() => {});
  }

  /**
   * 注册命令
   * @param {Object} command
   * @param {string} command.id - 唯一ID（建议格式：插件.动作，如 note.create）
   * @param {string} command.title - 命令标题
   * @param {string} [command.icon] - 图标名
   * @param {string} [command.shortcut] - 快捷键（如 Ctrl+N）
   * @param {Function} command.handler - 执行函数
   * @param {string} [command.pluginId] - 所属插件ID
   * @param {string} [command.category] - 分类
   */
  register(command) {
    this._commands.set(command.id, command);
    this._onCommandsChange(this.getCommands());
    console.log(`[CommandBar] Command registered: ${command.id}`);
  }

  /**
   * 取消注册命令
   */
  unregister(id) {
    if (this._commands.has(id)) {
      this._commands.delete(id);
      this._onCommandsChange(this.getCommands());
    }
  }

  /**
   * 移除插件的所有命令
   */
  removePluginCommands(pluginId) {
    const idsToRemove = [];
    this._commands.forEach((cmd, id) => {
      if (cmd.pluginId === pluginId) idsToRemove.push(id);
    });
    idsToRemove.forEach((id) => this._commands.delete(id));
    if (idsToRemove.length > 0) {
      this._onCommandsChange(this.getCommands());
    }
  }

  /**
   * 获取所有命令
   */
  getCommands() {
    return Array.from(this._commands.values());
  }

  /**
   * 执行命令
   */
  execute(id) {
    const command = this._commands.get(id);
    if (command && typeof command.handler === 'function') {
      command.handler();
      return true;
    }
    console.warn(`[CommandBar] Command not found: ${id}`);
    return false;
  }

  /**
   * 打开命令面板（触发事件）
   */
  open() {
    // 由 App.jsx 监听此事件
    window.dispatchEvent(new CustomEvent('commandbar:open'));
  }

  /**
   * 清空所有命令
   */
  clear() {
    this._commands.clear();
    this._onCommandsChange(this.getCommands());
  }
}

export default PluginCommandBar;
