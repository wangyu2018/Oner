const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('widgetAPI', {
  getState: () => ipcRenderer.invoke('widget-get-state'),
  toggleClickThrough: () => ipcRenderer.invoke('widget-toggle-click-through'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('widget-toggle-always-on-top'),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('widget-set-always-on-top', value),
  setOpacity: (opacity) => ipcRenderer.invoke('widget-set-opacity', opacity),
  getNotes: () => ipcRenderer.invoke('widget-get-notes'),
  openNote: (id) => ipcRenderer.invoke('widget-open-note', id),

  onClickThroughChanged: (callback) => {
    ipcRenderer.on('widget-click-through-changed', (_, val) => callback(val));
  },
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on('widget-always-on-top-changed', (_, val) => callback(val));
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
