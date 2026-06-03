import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * 默认快捷键配置
 */
const DEFAULT_SHORTCUTS = {
  commandPalette: { key: 'k', ctrl: true, shift: false, meta: true, label: '打开命令面板' },
  voiceInput: { key: 'v', ctrl: true, shift: true, meta: true, label: '语音录入' },
  newNote: { key: 'n', ctrl: true, shift: true, meta: true, label: '新建笔记' },
};

/**
 * 快捷键钩子
 * 读取 user_settings 中的自定义快捷键配置，注册全局 keydown 监听
 */
export default function useShortcuts(handlers = {}) {
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS);

  // 加载自定义快捷键
  useEffect(() => {
    api.settings.get().then(res => {
      if (res.data?.shortcuts) {
        setShortcuts(prev => ({ ...prev, ...res.data.shortcuts }));
      }
    }).catch(() => {});
  }, []);

  // 注册全局快捷键
  useEffect(() => {
    const handler = (e) => {
      for (const [id, sc] of Object.entries(shortcuts)) {
        const modMatch = sc.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = sc.shift ? e.shiftKey : !e.shiftKey;
        if (modMatch && shiftMatch && e.key.toLowerCase() === sc.key) {
          e.preventDefault();
          if (handlers[id]) {
            handlers[id](e);
          }
          break;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts, handlers]);

  /**
   * 保存快捷键配置
   */
  const saveShortcuts = useCallback(async (newShortcuts) => {
    const merged = { ...shortcuts, ...newShortcuts };
    await api.settings.update({ shortcuts: merged });
    setShortcuts(merged);
  }, [shortcuts]);

  return { shortcuts, saveShortcuts };
}
