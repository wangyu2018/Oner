import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, Monitor, LayoutGrid, Kanban, Tags, Lock, Tag } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import BackupMenu from './BackupMenu';
import DesktopSettings from './DesktopSettings';
import SyncStatus from './SyncStatus';
import CategoryManager from './CategoryManager';
import GlobalQuickEntry from './GlobalQuickEntry';
import Logo from './Logo';
import { useAuthContext } from '../App';

export default function Toolbar({
  onCreateNote, activeTag, onClearTag, activeStatus, onStatusChange,
  lastSync, onRefresh, loading, onQuickCreate, onVoiceInput,
  categories = [], activeCategory = null,
  onCategoryClick, showCategoryPills = false, categoryPills = [] }) {
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
        {/* Progress bar */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent/15 overflow-hidden">
            <div className="h-full w-1/2 bg-accent rounded-full animate-progress-bar" />
          </div>
        )}

        {/* Single row: Logo + Status + Input(~1/5) + Actions + Avatar */}
        <div className="px-3 py-1.5 flex items-center justify-between gap-2">
          {/* Left: Logo + Status */}
          <div className="flex items-center gap-2 shrink-0">
            <Logo size={20} showText={true} />
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
            {activeTag && (
              <button
                onClick={onClearTag}
                className="text-xs px-2 py-1 rounded-full bg-accent-100 dark:bg-accent-900/50
                  text-accent-800 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-900"
              >
                #{activeTag} ×
              </button>
            )}
            {onStatusChange && (
              <div className="hidden md:flex items-center gap-1">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onStatusChange(option.value)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                      activeStatus === option.value
                        ? 'bg-accent-500 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spacer to push input center */}
          <div className="flex-1" />

          {/* Input bar ~1/5 width */}
          <div className="w-1/5 max-w-xs min-w-[150px]">
            <GlobalQuickEntry
              compact
              onCreateNote={onQuickCreate}
              onVoiceInput={onVoiceInput}
              categories={categories}
              activeCategory={activeCategory}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: Actions + Avatar */}
          <div className="flex items-center gap-0.5 shrink-0">
            <SyncStatus lastSync={lastSync} onRefresh={onRefresh} loading={loading} />
            <BackupMenu />
            <button
              onClick={() => navigate(location.pathname === '/board' ? '/' : '/board')}
              className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title={location.pathname === '/board' ? '网格视图' : '看板视图'}
            >
              {location.pathname === '/board' ? <LayoutGrid size={15} /> : <Kanban size={15} />}
            </button>
            <ThemeToggle />
            {isElectron && (
              <button
                onClick={() => setShowDesktopSettings(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                title="桌面设置"
              >
                <Monitor size={15} />
              </button>
            )}

            <div className="relative ml-0.5" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center ring-1 ring-accent-300 dark:ring-accent-700">
                    <span className="text-white text-[10px] font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden md:inline text-xs text-gray-600 dark:text-gray-400">
                  {user?.username}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || '未设置邮箱'}</p>
                  </div>
                  <button onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Settings size={16} /> 用户中心
                  </button>
                  <button onClick={() => { setShowUserMenu(false); navigate('/passwords'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Lock size={16} /> 密码备忘
                  </button>
                  <button onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <LogOut size={16} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category pills sub-row (only shown on BoardPage) */}
        {showCategoryPills && categoryPills.length > 0 && (
          <div className="px-3 pb-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-gray-100 dark:border-gray-800/50">
            <span className="text-[10px] text-gray-400 shrink-0">分类</span>
            {categoryPills.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryClick?.(cat.name)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.name
                    ? 'text-white ring-2 ring-offset-1 dark:ring-offset-gray-950'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}
              >
                <Tag size={10} />
                {cat.name}
                {activeCategory === cat.name && (
                  <span
                    className="ml-0.5 opacity-70 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); onCategoryClick?.(null); }}
                  >×</span>
                )}
              </button>
            ))}
            <button
              onClick={() => setShowCategoryManager(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
                text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
              title="管理分类"
            >
              <Tags size={10} />
              管理
            </button>
          </div>
        )}
      </header>

      <DesktopSettings isOpen={showDesktopSettings} onClose={() => setShowDesktopSettings(false)} />
      <CategoryManager isOpen={showCategoryManager} onClose={() => setShowCategoryManager(false)} />
    </>
  );
}
