import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Settings, Monitor, Lock, ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import BackupMenu from './BackupMenu';
import DesktopSettings from './DesktopSettings';
import SyncStatus from './SyncStatus';
import Modal from './ui/Modal';
import Logo from './Logo';
import { useAuthContext } from '../App';

export default function CommandBar({
  breadcrumb = '首页',
  lastSync,
  onRefresh,
  loading,
  rightContent,
  onVoiceInput,
  showBack = false,
}) {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsElectron(!!window.electronAPI);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-12 flex items-center justify-between gap-3 px-4 lg:px-5
        bg-white/92 dark:bg-gray-950/92 backdrop-blur-xl saturate-180
        border-b border-gray-200 dark:border-gray-800
        transition-colors duration-normal"
      >
        {/* 左侧：Logo + 面包屑 */}
        <div className="flex items-center gap-2 shrink-0">
          {showBack && (
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                text-gray-500 dark:text-gray-400 transition-colors"
              title="返回首页"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <Logo size={22} showText={false} />
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {breadcrumb}
          </span>
        </div>



        {/* 右侧：操作按钮 + 头像 */}
        <div className="flex items-center gap-1 shrink-0">
          {rightContent}
          <SyncStatus lastSync={lastSync} onRefresh={onRefresh} loading={loading} />
          <BackupMenu />
          <ThemeToggle />

          {isElectron && (
            <button
              onClick={() => setShowDesktopSettings(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="桌面设置"
            >
              <Monitor size={15} />
            </button>
          )}

          {/* 用户头像菜单 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center w-7 h-7 ml-1 rounded-full
                bg-gradient-to-br from-accent-400 to-accent-600
                ring-1 ring-white/20 dark:ring-gray-700/50
                hover:ring-2 hover:ring-accent-300 dark:hover:ring-accent-700
                transition-all cursor-pointer"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username}
                  className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-[11px] font-semibold select-none">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48
                bg-white dark:bg-gray-800 rounded-xl shadow-lg
                border border-gray-200 dark:border-gray-700 py-1 z-50
                animate-slide-down"
              >
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || '未设置邮箱'}
                  </p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm
                    text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings size={16} /> 用户中心
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/passwords'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm
                    text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Lock size={16} /> 密码备忘
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm
                    text-red-600 dark:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut size={16} /> 退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <DesktopSettings isOpen={showDesktopSettings} onClose={() => setShowDesktopSettings(false)} />

      {/* 退出确认弹窗 */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="退出登录"
        size="sm"
      >
        <div className="text-center py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            确定要退出登录吗？
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-5 py-2 rounded-xl text-sm font-medium
                border border-gray-200 dark:border-gray-700
                text-gray-700 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              取消
            </button>
            <button
              onClick={confirmLogout}
              className="px-5 py-2 rounded-xl text-sm font-medium
                bg-red-500 hover:bg-red-600 text-white
                transition-all active:scale-[0.98]"
            >
              确认退出
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
