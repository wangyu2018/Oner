/**
 * EventBus — 插件间通信的事件总线
 *
 * 用法：
 *   eventBus.on('notes:changed', callback)
 *   eventBus.emit('notes:changed', { noteId: 1 })
 *   eventBus.off('notes:changed', callback)
 */
export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名（建议格式：模块:动作，如 notes:changed）
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 订阅一次性事件
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * 取消订阅
   */
  off(event, callback) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this._listeners.delete(event);
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名
   * @param {...any} args - 传递给回调的参数
   */
  emit(event, ...args) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(...args);
        } catch (err) {
          console.error(`[EventBus] Error in listener for "${event}":`, err);
        }
      });
    }
  }

  /**
   * 获取所有事件名
   */
  events() {
    return Array.from(this._listeners.keys());
  }

  /**
   * 清空所有监听器（慎用，仅用于测试或插件卸载）
   */
  clear() {
    this._listeners.clear();
  }

  /**
   * 清空指定事件的所有监听器
   */
  clearEvent(event) {
    this._listeners.delete(event);
  }
}

// 全局单例
export const globalEventBus = new EventBus();
export default globalEventBus;
