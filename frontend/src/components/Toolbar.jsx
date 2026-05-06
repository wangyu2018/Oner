import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, User, LogOut, Settings, Monitor, LayoutGrid, Kanban, Tags } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import BackupMenu from './BackupMenu';
import DesktopSettings from './DesktopSettings';
import SyncStatus from './SyncStatus';
import CategoryManager from './CategoryManager';
import Logo from './Logo';
import { useAuthContext } from '../App';

export default function Toolbar({ onCreateNote, activeTag, onClearTag, activeStatus, onStatusChange, lastSync, onRefresh, loading }) {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
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
    if (confirm('确定要退出登录吗？')) {
      await logout();
      navigate('/login', { replace: true });
    }
  };

  // 状态筛选选项
  const statusOptions = [
    { value: '', label: '全部' },
    { value: 'note', label: '备忘' },
    { value: 'todo', label: '待办' },
    { value: 'in_progress', label: '进行中' },
    { value: 'done', label: '已完成' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md
        border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} showText={true} />
            {activeTag && (
              <button
                onClick={onClearTag}
                className="text-xs px-2 py-1 rounded-full bg-accent-100 dark:bg-accent-900/50
                  text-accent-800 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-900"
              >
                #{activeTag} ×
              </button>
            )}

            {/* 状态筛选 (桌面端) */}
            {onStatusChange && (
              <div className="hidden md:flex items-center gap-1 ml-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onStatusChange(option.value)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                      activeStatus === option.value
                        ? 'bg-accent-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SyncStatus lastSync={lastSync} onRefresh={onRefresh} loading={loading} />
            <button
              onClick={onCreateNote}
              className="inline-flex items-center gap-2 px-3 py-2 bg-accent text-white
                rounded-lg hover:bg-accent-600 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">新建备忘</span>
            </button>
            <BackupMenu />
            {/* 分类管理 */}
            <button
              onClick={() => setShowCategoryManager(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title="分类管理"
            >
              <Tags size={18} />
            </button>
            {/* 视图切换 */}
            <button
              onClick={() => navigate(location.pathname === '/board' ? '/' : '/board')}
              className="hidden sm:inline-flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title={location.pathname === '/board' ? '网格视图' : '看板视图'}
            >
              {location.pathname === '/board' ? <LayoutGrid size={18} /> : <Kanban size={18} />}
            </button>
            <ThemeToggle />

            {/* 桌面设置（仅 Electron 环境显示） */}
            {isElectron && (
              <button
                onClick={() => setShowDesktopSettings(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                title="桌面设置"
              >
                <Monitor size={18} />
              </button>
            )}

            {/* 用户菜单 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden md:inline text-sm text-gray-700 dark:text-gray-300">
                  {user?.username}
                </span>
              </button>

              {/* 下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || '未设置邮箱'}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings size={16} />
                    用户中心
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 桌面设置弹窗 */}
      <DesktopSettings
        isOpen={showDesktopSettings}
        onClose={() => setShowDesktopSettings(false)}
      />

      {/* 分类管理弹窗 */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </>
  );
}
