const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, Notification, nativeImage, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

const isDev = process.env.NODE_ENV === 'development';

// 配置存储
const store = new Store({
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    launchAtLogin: false,
    minimizeToTray: true,
    showNotifications: true,
    widget: {
      visible: false,
      x: undefined,
      y: undefined,
      width: 300,
      height: 400,
      opacity: 0.85,
      alwaysOnTop: true,
      clickThrough: false,
    },
  },
});

// 全局变量
let mainWindow = null;
let tray = null;
let widgetWindow = null;
let isQuitting = false;

// 开机自启
const autoLauncher = new AutoLaunch({
  name: 'Oner',
  path: app.getPath('exe'),
});

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createApp);
}

function createApp() {
  createMainWindow();
  createMenu();
  createTray();
  registerShortcuts();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}

// ─── 菜单 ─────────────────────────────────────────

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: '新建备忘',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendToMain('menu-new-note'),
        },
        {
          label: '新建窗口',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            createMainWindow();
          },
        },
        { type: 'separator' },
        {
          label: '导入',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'Oner Backup', extensions: ['zip', 'json', 'md'] }],
              properties: ['openFile'],
            });
            if (!result.canceled) {
              sendToMain('menu-import', result.filePaths[0]);
            }
          },
        },
        {
          label: '导出',
          submenu: [
            { label: '导出为 Markdown', click: () => sendToMain('menu-export-md') },
            { label: '导出 ZIP 备份', click: () => sendToMain('menu-export-zip') },
          ],
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { type: 'separator' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          acceleratorWorksWhenHidden: false,
          click: (_, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          },
        },
        { type: 'separator' },
        {
          label: '深色模式切换',
          accelerator: 'CmdOrCtrl+D',
          click: () => sendToMain('menu-toggle-theme'),
        },
        { type: 'separator' },
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+=',
          click: (_, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.setZoomLevel(focusedWindow.webContents.getZoomLevel() + 0.5);
          },
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click: (_, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.setZoomLevel(focusedWindow.webContents.getZoomLevel() - 0.5);
          },
        },
        {
          label: '重置缩放',
          accelerator: 'CmdOrCtrl+0',
          click: (_, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.setZoomLevel(0);
          },
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: (_, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        {
          label: '最小化',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            if (mainWindow) mainWindow.minimize();
          },
        },
        {
          label: '切换全屏',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        { type: 'separator' },
        {
          label: '桌面便签',
          type: 'checkbox',
          checked: store.get('widget.visible'),
          click: (menuItem) => {
            if (widgetWindow && !widgetWindow.isDestroyed()) {
              destroyWidget();
              menuItem.checked = false;
            } else {
              createDesktopWidget();
              menuItem.checked = true;
            }
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: '关于 Oner',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 Oner',
              message: 'Oner — 轻量备忘',
              detail: `版本: ${app.getVersion()}\n记录此刻，轻如空气`,
              icon: getIconPath(),
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function sendToMain(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// ─── 桌面便签 ────────────────────────────────────

function createDesktopWidget() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.show();
    return;
  }

  const widgetState = store.get('widget');

  widgetWindow = new BrowserWindow({
    width: widgetState.width || 300,
    height: widgetState.height || 400,
    x: widgetState.x,
    y: widgetState.y,
    type: 'toolbar',
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: widgetState.alwaysOnTop,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'widget-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  widgetWindow.loadFile(path.join(__dirname, 'widget.html'));

  widgetWindow.on('ready-to-show', () => {
    widgetWindow.show();
    if (widgetState.clickThrough) {
      widgetWindow.setIgnoreMouseEvents(true, { forward: true });
    }
    store.set('widget.visible', true);
  });

  widgetWindow.on('closed', () => {
    widgetWindow = null;
    store.set('widget.visible', false);
    // Update menu checkbox
    const menu = Menu.getApplicationMenu();
    if (menu) {
      const windowMenu = menu.items.find(item => item.label === 'Window');
      if (windowMenu) {
        const widgetItem = windowMenu.submenu.items.find(item => item.label === '桌面便签');
        if (widgetItem) widgetItem.checked = false;
      }
    }
  });

  widgetWindow.on('resize', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      const [w, h] = widgetWindow.getSize();
      store.set('widget.width', w);
      store.set('widget.height', h);
    }
  });

  widgetWindow.on('move', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      const [x, y] = widgetWindow.getPosition();
      store.set('widget.x', x);
      store.set('widget.y', y);
    }
  });
}

function destroyWidget() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.close();
  }
  widgetWindow = null;
  store.set('widget.visible', false);
}

function toggleWidgetClickThrough() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    const current = store.get('widget.clickThrough');
    const newVal = !current;
    widgetWindow.setIgnoreMouseEvents(newVal, { forward: true });
    store.set('widget.clickThrough', newVal);
    widgetWindow.webContents.send('widget-click-through-changed', newVal);
  }
}

function toggleWidgetAlwaysOnTop() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    const current = store.get('widget.alwaysOnTop');
    const newVal = !current;
    widgetWindow.setAlwaysOnTop(newVal);
    store.set('widget.alwaysOnTop', newVal);
    widgetWindow.webContents.send('widget-always-on-top-changed', newVal);
  }
}

function setWidgetOpacity(opacity) {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.setOpacity(opacity);
    store.set('widget.opacity', opacity);
  }
}

// ─── 主窗口 ──────────────────────────────────────

function createMainWindow() {
  const { width, height, x, y } = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width: width || 1200,
    height: height || 800,
    x: x,
    y: y,
    minWidth: 800,
    minHeight: 600,
    title: 'Oner - 轻量备忘',
    icon: getIconPath(),
    show: false,
    frame: true,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && store.get('minimizeToTray')) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('resize', saveWindowBounds);
  mainWindow.on('move', saveWindowBounds);

  return mainWindow;
}

function saveWindowBounds() {
  if (mainWindow && !mainWindow.isMinimized() && !mainWindow.isMaximized()) {
    store.set('windowBounds', mainWindow.getBounds());
  }
}

// ─── 托盘 ─────────────────────────────────────────

function createTray() {
  const iconPath = getTrayIconPath();
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: '桌面便签',
      type: 'checkbox',
      checked: store.get('widget.visible'),
      click: (menuItem) => {
        if (widgetWindow && !widgetWindow.isDestroyed()) {
          destroyWidget();
          menuItem.checked = false;
        } else {
          createDesktopWidget();
          menuItem.checked = true;
        }
      },
    },
    { type: 'separator' },
    {
      label: '快速新建备忘',
      accelerator: 'CommandOrControl+N',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('create-note');
        }
      },
    },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: store.get('launchAtLogin'),
      click: (menuItem) => {
        toggleAutoLaunch(menuItem.checked);
      },
    },
    {
      label: '最小化到托盘',
      type: 'checkbox',
      checked: store.get('minimizeToTray'),
      click: (menuItem) => {
        store.set('minimizeToTray', menuItem.checked);
      },
    },
    {
      label: '显示通知',
      type: 'checkbox',
      checked: store.get('showNotifications'),
      click: (menuItem) => {
        store.set('showNotifications', menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Oner - 轻量备忘');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── 快捷键 ───────────────────────────────────────

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+O', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// ─── IPC ──────────────────────────────────────────

function setupIPC() {
  // 应用信息
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-platform', () => process.platform);

  // 窗口控制
  ipcMain.handle('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });
  ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  ipcMain.handle('close-window', () => {
    if (mainWindow) mainWindow.hide();
  });

  // 设置
  ipcMain.handle('get-settings', () => {
    return {
      launchAtLogin: store.get('launchAtLogin'),
      minimizeToTray: store.get('minimizeToTray'),
      showNotifications: store.get('showNotifications'),
    };
  });
  ipcMain.handle('update-settings', (event, settings) => {
    if (settings.launchAtLogin !== undefined) {
      toggleAutoLaunch(settings.launchAtLogin);
    }
    if (settings.minimizeToTray !== undefined) {
      store.set('minimizeToTray', settings.minimizeToTray);
    }
    if (settings.showNotifications !== undefined) {
      store.set('showNotifications', settings.showNotifications);
    }
  });

  // 通知
  ipcMain.handle('show-notification', (event, { title, body }) => {
    if (store.get('showNotifications')) {
      const notification = new Notification({
        title: title || 'Oner',
        body: body,
        icon: getIconPath(),
      });
      notification.show();
    }
  });

  // 开机自启
  ipcMain.handle('toggle-auto-launch', (event, enable) => {
    toggleAutoLaunch(enable);
  });

  // ─── 桌面便签 IPC ───

  ipcMain.handle('widget-get-state', () => {
    return store.get('widget');
  });

  ipcMain.handle('widget-toggle-click-through', () => {
    toggleWidgetClickThrough();
    return store.get('widget.clickThrough');
  });

  ipcMain.handle('widget-toggle-always-on-top', () => {
    toggleWidgetAlwaysOnTop();
    return store.get('widget.alwaysOnTop');
  });

  ipcMain.handle('widget-set-always-on-top', (event, value) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.setAlwaysOnTop(value);
    }
    store.set('widget.alwaysOnTop', value);
    return value;
  });

  ipcMain.handle('widget-set-opacity', (event, opacity) => {
    setWidgetOpacity(opacity);
  });

  ipcMain.handle('widget-get-notes', async () => {
    try {
      // Get token from main window's localStorage
      const token = mainWindow && !mainWindow.isDestroyed()
        ? await mainWindow.webContents.executeJavaScript('localStorage.getItem("oner_token")')
        : null;
      if (!token) return [];

      const http = require('http');
      return new Promise((resolve) => {
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/notes?limit=20',
          headers: { 'Authorization': `Bearer ${token}` },
        };
        const req = http.get(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.data?.notes || []);
            } catch { resolve([]); }
          });
        });
        req.on('error', () => resolve([]));
        req.end();
      });
    } catch { return []; }
  });

  ipcMain.handle('widget-open-note', (event, noteId) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('open-note', noteId);
    }
  });
}

async function toggleAutoLaunch(enable) {
  try {
    if (enable) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
    store.set('launchAtLogin', enable);
  } catch (err) {
    console.error('Auto launch error:', err);
  }
}

function getIconPath() {
  if (isDev) {
    return path.join(__dirname, 'icons/icon.png');
  }
  return path.join(process.resourcesPath, 'icon.png');
}

function getTrayIconPath() {
  if (isDev) {
    return path.join(__dirname, 'icons/icon.png');
  }
  return path.join(process.resourcesPath, 'icon.png');
}

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
