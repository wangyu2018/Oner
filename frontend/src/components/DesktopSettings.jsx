import React, { useState, useEffect } from 'react';
import { Monitor, Bell, Power, Minimize2, X } from 'lucide-react';

export default function DesktopSettings({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    launchAtLogin: false,
    minimizeToTray: true,
    showNotifications: true,
  });
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // 检查是否在 Electron 环境
    setIsElectron(!!window.electronAPI);

    // 加载设置
    if (window.electronAPI) {
      window.electronAPI.getSettings().then(setSettings);
    }
  }, []);

  const handleToggle = async (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);

    if (window.electronAPI) {
      await window.electronAPI.updateSettings({ [key]: newSettings[key] });
    }
  };

  if (!isOpen || !isElectron) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Monitor size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">桌面设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings */}
        <div className="p-4 space-y-4">
          {/* 开机自启 */}
          <SettingItem
            icon={Power}
            title="开机自启"
            description="系统启动时自动运行 Oner"
            checked={settings.launchAtLogin}
            onChange={() => handleToggle('launchAtLogin')}
          />

          {/* 最小化到托盘 */}
          <SettingItem
            icon={Minimize2}
            title="最小化到托盘"
            description="关闭窗口时最小化到系统托盘"
            checked={settings.minimizeToTray}
            onChange={() => handleToggle('minimizeToTray')}
          />

          {/* 显示通知 */}
          <SettingItem
            icon={Bell}
            title="显示通知"
            description="收到新消息时显示系统通知"
            checked={settings.showNotifications}
            onChange={() => handleToggle('showNotifications')}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium mb-1">快捷键说明：</p>
            <p>Ctrl+Shift+O - 显示/隐藏窗口</p>
            <p>Ctrl+Shift+N - 快速新建备忘</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <Icon size={18} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked
            ? 'bg-blue-500'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
