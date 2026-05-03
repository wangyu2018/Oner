const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // 窗口控制
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window'),

  // 设置
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),

  // 通知
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),

  // 开机自启
  toggleAutoLaunch: (enable) => ipcRenderer.invoke('toggle-auto-launch', enable),

  // 事件监听
  onCreateNote: (callback) => {
    ipcRenderer.on('create-note', () => callback());
  },
  onOpenNote: (callback) => {
    ipcRenderer.on('open-note', (_, noteId) => callback(noteId));
  },

  // 移除监听
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
