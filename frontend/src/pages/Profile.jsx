import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Monitor, LogOut, Save, Trash2, Palette, Keyboard, KeyRound, Brain, Eye, EyeOff, Layout, Puzzle, Power, PowerOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import ThemeCustomizer from '../components/ThemeCustomizer';
import CommandBar from '../components/CommandBar';
import { usePluginManagerContext } from '../App';

const DEFAULT_SHORTCUTS = {
  commandPalette: { key: 'k', ctrl: true, shift: false, meta: true, label: '打开命令面板' },
  voiceInput: { key: 'v', ctrl: true, shift: true, meta: true, label: '语音录入' },
  newNote: { key: 'n', ctrl: true, shift: true, meta: true, label: '新建笔记' },
};

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 个人资料
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');

  // 修改密码
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 设备列表
  const [sessions, setSessions] = useState([]);

  // 快捷键
  const [shortcuts, setShortcuts] = useState(null);
  const [editingShortcutId, setEditingShortcutId] = useState(null);
  const recordingRef = useRef(null);

  // 密码库 PIN
  const [vaultPin, setVaultPin] = useState('');
  const [vaultPinConfirm, setVaultPinConfirm] = useState('');
  const [hasVaultPin, setHasVaultPin] = useState(false);

  // 密码设置
  const [passwordIncludeInSearch, setPasswordIncludeInSearch] = useState(false);

  // AI设置
  const [aiProvider, setAiProvider] = useState('deepseek');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiBaseURL, setAiBaseURL] = useState('');
  const [showAiApiKey, setShowAiApiKey] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  const [homeLayout, setHomeLayout] = useState('combined');

  // 插件管理
  const [installedPlugins, setInstalledPlugins] = useState([]);
  const [loadingPlugins, setLoadingPlugins] = useState(false);
  const [togglingPlugin, setTogglingPlugin] = useState(null);
  const pluginCtx = usePluginManagerContext();

  // 插件功能描述
  const PLUGIN_INFO = {
    'oner.plugin.core-notes': {
      desc: '笔记管理核心模块，提供笔记创建、编辑、分类、搜索等全部基础能力',
      features: ['笔记 CRUD', '分类管理', '全文搜索', '状态筛选', '标签系统'],
      routes: ['/ (首页)', '/notes/:id (笔记详情)'],
      icon: '📝', tagClass: 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
    },
    'oner.plugin.ai': {
      desc: 'AI 智能助手，支持笔记分析、任务拆解、内容润色和智能对话',
      features: ['智能对话', '笔记分析', '内容润色', '分类总结'],
      routes: ['/ai (AI 对话)'],
      icon: '🤖', tagClass: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
    'oner.plugin.password': {
      desc: '密码保险库，安全存储和管理各类账号密码，支持 PIN 二次验证',
      features: ['密码存储', '自动分类', 'PIN 保护', '搜索过滤'],
      routes: ['/passwords (密码库)'],
      icon: '🔐', tagClass: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
    'oner.plugin.kanban': {
      desc: '看板视图，以泳道/卡片形式管理任务，支持拖拽排序和状态流转',
      features: ['泳道看板', '拖拽排序', '状态流转', '今日概览'],
      routes: ['/board (看板)'],
      icon: '📋', tagClass: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    'oner.plugin.memo': {
      desc: '备忘插件，快速记录和回顾碎片化备忘信息',
      features: ['快速备忘', '时间线', '分类筛选'],
      routes: ['/memos (备忘)'],
      icon: '📌', tagClass: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    },
  };

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'devices') {
      loadSessions();
    }
    if (activeTab === 'shortcuts' || activeTab === 'password-settings' || activeTab === 'ai') {
      loadSettings();
    }
    if (activeTab === 'vault-pin') {
      checkVaultPin();
    }
    if (activeTab === 'plugins') {
      loadPlugins();
    }
  }, [activeTab]);

  // 加载首页布局设置
  useEffect(() => {
    if (activeTab === 'home-layout') {
      api.settings.get().then(res => {
        const s = res.data || {};
        setHomeLayout(s.homeLayout || 'combined');
      }).catch(() => {});
    }
  }, [activeTab]);

  const loadSessions = async () => {
    try {
      const { data } = await api.auth.getSessions();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Load sessions error:', err);
    }
  };

  // 切换插件启用/停用
  const handleTogglePlugin = async (pluginId, currentStatus) => {
    if (!pluginCtx?.pluginManager) return;
    setTogglingPlugin(pluginId);
    try {
      if (currentStatus === 'active') {
        await pluginCtx.pluginManager.deactivate(pluginId);
      } else {
        await pluginCtx.pluginManager.activate(pluginId);
      }
      // 更新本地状态
      setInstalledPlugins(prev => prev.map(p =>
        p.id === pluginId ? { ...p, status: currentStatus === 'active' ? 'inactive' : 'active' } : p
      ));
    } catch (err) {
      console.error('Toggle plugin error:', err);
    } finally {
      setTogglingPlugin(null);
    }
  };

  // 加载插件列表 — 从 PluginManagerContext 读取实时状态
  const loadPlugins = () => {
    setLoadingPlugins(true);
    try {
      // 后端 /api/plugins 硬编码返回 active，改用前端 PluginManager 真实状态
      const ctxPlugins = pluginCtx?.plugins || [];
      const known = [
        { id: 'oner.plugin.core-notes', name: '核心笔记', type: 'core', required: true },
        { id: 'oner.plugin.ai', name: 'AI 智能助手', type: 'feature', required: false },
        { id: 'oner.plugin.password', name: '密码保险库', type: 'feature', required: false },
        { id: 'oner.plugin.kanban', name: '看板视图', type: 'feature', required: false },
        { id: 'oner.plugin.memo', name: '备忘插件', type: 'feature', required: false },
      ];
      setInstalledPlugins(known.map(base => {
        const live = ctxPlugins.find(p => p.id === base.id);
        return { ...base, status: live ? live.status : 'registered' };
      }));
    } catch (err) {
      console.error('Load plugins error:', err);
      setInstalledPlugins([]);
    } finally {
      setLoadingPlugins(false);
    }
  };

  // 加载设置（快捷键+密码设置）
  const loadSettings = async () => {
    try {
      const res = await api.settings.get();
      const settings = res.data || {};
      setShortcuts(settings.shortcuts || DEFAULT_SHORTCUTS);
      setPasswordIncludeInSearch(settings.passwordDefaults?.includeInSearch ?? false);
      if (settings.ai) {
        setAiProvider(settings.ai.provider || 'deepseek');
        setAiModel(settings.ai.model || '');
        setAiBaseURL(settings.ai.baseURL || '');
        setAiApiKey(settings.ai.hasKey ? '********' : '');
      }
    } catch (err) {
      console.error('Load settings error:', err);
    }
  };

  // 检查是否已设置密码库 PIN
  const checkVaultPin = async () => {
    try {
      const res = await api.settings.get();
      const settings = res.data || {};
      setHasVaultPin(!!settings.vault_pin_hash);
      setVaultPin('');
      setVaultPinConfirm('');
    } catch {}
  };

  // 保存密码库 PIN
  const handleSaveVaultPin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!vaultPin) {
      setError('请输入 PIN 码');
      return;
    }
    if (vaultPin.length < 4) {
      setError('PIN 码至少 4 位');
      return;
    }
    if (vaultPin !== vaultPinConfirm) {
      setError('两次输入的 PIN 码不一致');
      return;
    }

    setLoading(true);
    try {
      // 将 PIN 明文发给后端，后端 hash 存储
      const res = await api.auth.updateProfile({
        vault_pin: vaultPin,
      });
      setHasVaultPin(true);
      setSuccess('密码库 PIN 已设置');
      setVaultPin('');
      setVaultPinConfirm('');
    } catch (err) {
      setError(err.message || '设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 捕获按键绑定
  useEffect(() => {
    if (!editingShortcutId) return;
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setEditingShortcutId(null);
        return;
      }
      setShortcuts(prev => ({
        ...prev,
        [editingShortcutId]: {
          ...prev[editingShortcutId],
          key: e.key.toLowerCase(),
          ctrl: e.ctrlKey || e.metaKey,
          shift: e.shiftKey,
          meta: e.metaKey,
        }
      }));
      setEditingShortcutId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editingShortcutId]);

  // 格式化快捷键显示
  const formatShortcut = (sc) => {
    const parts = [];
    if (sc.meta) parts.push('⌘');
    else if (sc.ctrl) parts.push('Ctrl');
    if (sc.shift) parts.push('Shift');
    parts.push(sc.key.toUpperCase());
    return parts.join('+');
  };

  // 保存快捷键
  const handleSaveShortcuts = async () => {
    setError('');
    setSuccess('');
    try {
      await api.settings.update({ shortcuts });
      setSuccess('快捷键已保存');
    } catch (err) {
      setError(err.message || '保存失败');
    }
  };

  // 保存密码设置
  const handleSavePasswordSettings = async () => {
    setError('');
    setSuccess('');
    try {
      await api.settings.update({
        passwordDefaults: { includeInSearch: passwordIncludeInSearch }
      });
      setSuccess('密码设置已保存');
    } catch (err) {
      setError(err.message || '保存失败');
    }
  };

  // 更新个人资料
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.auth.updateProfile({
        email: email || null,
        avatar: avatar || null,
      });
      updateUser(data.user);
      setSuccess('个人资料已更新');
    } catch (err) {
      setError(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      setError('请输入当前密码和新密码');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少 6 个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      await api.auth.updateProfile({
        currentPassword,
        newPassword,
      });
      setSuccess('密码已修改');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  // 踢出设备
  const handleDeleteSession = async (sessionId) => {
    if (!confirm('确定要踢出该设备吗？')) {
      return;
    }

    try {
      await api.auth.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      setSuccess('设备已踢出');
    } catch (err) {
      setError(err.message || '踢出设备失败');
    }
  };

  // 登出
  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) {
      return;
    }
    await logout();
    navigate('/login', { replace: true });
  };

  // 保存首页布局
  const handleSaveHomeLayout = async () => {
    setError('');
    setSuccess('');
    try {
      await api.settings.update({ settings: { homeLayout } });
      setSuccess('首页布局已保存');
    } catch (err) {
      setError(err.message || '保存失败');
    }
  };

  const handleSaveAI = async () => {
    setAiSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.settings.update({
        ai: {
          provider: aiProvider,
          apiKey: aiApiKey === '********' ? undefined : aiApiKey,
          model: aiModel,
          baseURL: aiBaseURL,
        },
      });
      setSuccess('AI设置已保存');
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setAiSaving(false);
    }
  };

  // 测试AI连接
  const handleTestAI = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const res = await api.ai.testConnection({
        provider: aiProvider,
        apiKey: aiApiKey === '********' ? undefined : aiApiKey,
        model: aiModel,
        baseURL: aiBaseURL,
      });
      setAiTestResult(res.data);
    } catch (err) {
      setAiTestResult({ success: false, message: err.message });
    } finally {
      setAiTesting(false);
    }
  };

  // 格式化设备信息
  const formatDevice = (deviceStr) => {
    if (!deviceStr) return '未知设备';

    // 尝试解析 User-Agent
    if (deviceStr.includes('Windows')) return 'Windows';
    if (deviceStr.includes('Mac')) return 'macOS';
    if (deviceStr.includes('Linux')) return 'Linux';
    if (deviceStr.includes('Android')) return 'Android';
    if (deviceStr.includes('iPhone') || deviceStr.includes('iPad')) return 'iOS';

    return deviceStr.substring(0, 50) + '...';
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN');
  };

  const tabs = [
    { id: 'home-layout', label: '首页布局', icon: Layout },
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'password', label: '修改密码', icon: Lock },
    { id: 'ai', label: 'AI设置', icon: Brain },
    { id: 'plugins', label: '插件管理', icon: Puzzle },
    { id: 'shortcuts', label: '快捷键', icon: Keyboard },
    { id: 'vault-pin', label: '密码库PIN', icon: KeyRound },
    { id: 'password-settings', label: '密码设置', icon: Lock },
    { id: 'appearance', label: '外观', icon: Palette },
    { id: 'devices', label: '设备管理', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CommandBar
        breadcrumb="用户中心"
        showBack={true}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 移动端: 横向滚动tab */}
          <div className="md:hidden overflow-x-auto scrollbar-none -mx-4 px-4">
            <div className="flex gap-1 pb-3">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 桌面端: 侧边栏 */}
          <div className="hidden md:block md:w-48">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 border-l-2 border-accent-500'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut size={18} />
                退出登录
              </button>
            </div>
          </div>

          {/* 内容区 */}
          <div className="flex-1">
            {/* 提示信息 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* 个人资料 */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">个人资料</h2>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">用户名不可修改</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="用于找回密码"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      头像 URL
                    </label>
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save size={18} />
                        保存
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 修改密码 */}
            {activeTab === 'password' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">修改密码</h2>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      当前密码
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="请输入当前密码"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      新密码
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="至少 6 个字符"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="再次输入新密码"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Lock size={18} />
                        修改密码
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 设备管理 */}
            {activeTab === 'devices' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">设备管理</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  管理已登录的设备，最多支持 5 个设备同时在线
                </p>

                <div className="space-y-3">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Monitor size={20} className="text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatDevice(session.device)}
                            </span>
                            {session.isCurrent && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                                当前设备
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {session.ip} · 登录于 {formatTime(session.created_at)}
                          </div>
                        </div>
                      </div>

                      {!session.isCurrent && (
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="踢出设备"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      暂无登录设备
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 快捷键设置 */}
            {activeTab === 'shortcuts' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">快捷键</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  点击快捷键组合进行修改，按 Esc 取消
                </p>

                {!shortcuts ? (
                  <div className="text-center py-8 text-gray-400">加载中...</div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(shortcuts).map(([id, sc]) => (
                      <div key={id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {sc.label}
                        </span>
                        <button
                          onClick={() => setEditingShortcutId(editingShortcutId === id ? null : id)}
                          className={`px-3 py-1.5 text-sm font-mono rounded-lg border transition-all ${
                            editingShortcutId === id
                              ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 animate-pulse'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-accent-400 hover:text-accent-500'
                          }`}
                        >
                          {editingShortcutId === id ? '按下快捷键...' : formatShortcut(sc)}
                        </button>
                      </div>
                    ))}

                    <div className="pt-4">
                      <button
                        onClick={handleSaveShortcuts}
                        className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <Save size={18} />
                        保存快捷键
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 密码库 PIN */}
            {activeTab === 'vault-pin' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">密码库 PIN</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  设置 PIN 码后，访问密码库时需要二次认证（PIN 仅在当前会话有效，关闭浏览器后需重新输入）
                </p>

                <form onSubmit={handleSaveVaultPin} className="space-y-4">
                  {hasVaultPin && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        已设置 PIN 码保护
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {hasVaultPin ? '新 PIN 码' : 'PIN 码'}
                    </label>
                    <input
                      type="password"
                      value={vaultPin}
                      onChange={(e) => setVaultPin(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="至少 4 位数字或字母"
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      确认 PIN 码
                    </label>
                    <input
                      type="password"
                      value={vaultPinConfirm}
                      onChange={(e) => setVaultPinConfirm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="再次输入 PIN 码"
                      maxLength={20}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={18} />
                          {hasVaultPin ? '更新 PIN' : '设置 PIN'}
                        </>
                      )}
                    </button>

                    {hasVaultPin && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('确定清除密码库 PIN 保护？')) return;
                          // 检查是否有密码条目
                          try {
                            const pwRes = await api.passwords.list({ limit: 1 });
                            const pwCount = pwRes?.data?.entries?.length ?? pwRes?.data?.passwords?.length ?? 0;
                            if (pwCount > 0) {
                              setError(`密码库中还有 ${pwCount} 条密码条目，请先删除所有密码后再清除 PIN`);
                              return;
                            }
                          } catch { /* 查询失败则跳过检查 */ }
                          setLoading(true);
                          try {
                            await api.auth.updateProfile({ vault_pin: '' });
                            setHasVaultPin(false);
                            setVaultPin('');
                            setVaultPinConfirm('');
                            setSuccess('密码库 PIN 已清除');
                          } catch (err) {
                            setError(err.message || '清除失败');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                      >
                        清除 PIN
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* 密码设置 */}
            {activeTab === 'password-settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">密码设置</h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">全局搜索包含密码</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        开启后，在命令面板搜索时也会匹配密码条目标题和网址
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passwordIncludeInSearch}
                        onChange={(e) => setPasswordIncludeInSearch(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-300 dark:peer-focus:ring-accent-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent-500"></div>
                    </label>
                  </div>

                  <button
                    onClick={handleSavePasswordSettings}
                    className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Save size={18} />
                    保存设置
                  </button>
                </div>
              </div>
            )}

            {/* AI 设置 */}
            {activeTab === 'ai' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI 设置</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  配置AI模型提供商和API密钥，用于笔记分析、任务拆解和智能对话
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">模型提供商</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAiProvider(val);
                        setAiTestResult(null);
                        // 本地提供商自动填充默认值
                        if (val === 'ollama') {
                          setAiModel('qwen2.5');
                          setAiBaseURL('http://localhost:11434/v1');
                        } else if (val === 'lmstudio') {
                          setAiModel('llama-3.2-3b');
                          setAiBaseURL('http://localhost:1234/v1');
                        } else if (val === 'deepseek' || val === 'openai') {
                          setAiBaseURL('');
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="deepseek">DeepSeek</option>
                      <option value="mimo">MiMo (小米)</option>
                      <option value="openai">OpenAI</option>
                      <option value="ollama">Ollama (本地)</option>
                      <option value="lmstudio">LM Studio (本地)</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>

                  {aiProvider !== 'ollama' && aiProvider !== 'lmstudio' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                      <div className="relative">
                        <input
                          type={showAiApiKey ? 'text' : 'password'}
                          value={aiApiKey}
                          onChange={(e) => { setAiApiKey(e.target.value); setAiTestResult(null); }}
                          className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="输入你的 API Key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAiApiKey(!showAiApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showAiApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">模型名称</label>
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={aiProvider === 'deepseek' ? 'deepseek-chat' : aiProvider === 'openai' ? 'gpt-4o-mini' : aiProvider === 'ollama' ? 'qwen2.5' : aiProvider === 'lmstudio' ? 'llama-3.2-3b' : '模型名称'}
                    />
                  </div>

                  {(aiProvider === 'custom' || aiProvider === 'ollama' || aiProvider === 'lmstudio') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base URL</label>
                      <input
                        type="text"
                        value={aiBaseURL}
                        onChange={(e) => setAiBaseURL(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={aiProvider === 'ollama' ? 'http://localhost:11434/v1' : aiProvider === 'lmstudio' ? 'http://localhost:1234/v1' : 'https://your-api.com/v1'}
                      />
                    </div>
                  )}

                  {aiTestResult && (
                    <div className={`p-3 rounded-lg ${aiTestResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                      <p className={`text-sm ${aiTestResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {aiTestResult.success ? '连接成功' : '连接失败'}：{aiTestResult.message}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleTestAI}
                      disabled={aiTesting || (aiProvider !== 'ollama' && aiProvider !== 'lmstudio' && (!aiApiKey || aiApiKey === '********'))}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {aiTesting ? '测试中...' : '测试连接'}
                    </button>
                    <button
                      onClick={handleSaveAI}
                      disabled={aiSaving}
                      className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
                    >
                      <Save size={16} />
                      {aiSaving ? '保存中...' : '保存设置'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 首页布局 */}
            {activeTab === 'home-layout' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">首页布局</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  控制首页工作台与笔记详情的展示方式
                </p>

                <div className="space-y-4">
                  {/* 合并一页 — 模拟 Win+↑ 最大化合并 */}
                  <label
                    onClick={() => setHomeLayout('combined')}
                    className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      homeLayout === 'combined'
                        ? 'border-accent bg-accent-50 dark:bg-accent-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 动效预览 */}
                      <div className="relative w-28 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        {/* 背景桌面 */}
                        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600" />
                        {/* 被拖拽合并 → 单个窗口占满 */}
                        <div className={`absolute inset-1 rounded-md border-2 border-accent/40
                          transition-all duration-700 ease-out overflow-hidden
                          ${homeLayout === 'combined'
                            ? 'opacity-100 scale-100'
                            : 'opacity-30 scale-90 translate-y-2'
                          }`}
                          style={homeLayout === 'combined'
                            ? { boxShadow: '0 0 12px rgba(99,102,241,0.3)' }
                            : {}}>
                          {/* 标题栏 */}
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 flex items-center px-1 gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-red-400" />
                            <div className="w-1 h-1 rounded-full bg-yellow-400" />
                            <div className="w-1 h-1 rounded-full bg-green-400" />
                          </div>
                          {/* 工作台区域 */}
                          <div className={`h-[34%] bg-gradient-to-b from-red-100/80 to-red-50/60 dark:from-red-900/30 dark:to-red-800/20
                            flex items-center justify-center text-[6px] font-semibold text-red-500 dark:text-red-400
                            transition-all duration-500 delay-100
                            ${homeLayout === 'combined' ? 'opacity-100' : 'opacity-60'}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex gap-0.5">
                                <div className="w-2 h-1 rounded-[1px] bg-red-300 dark:bg-red-600" />
                                <div className="w-2 h-1 rounded-[1px] bg-red-300 dark:bg-red-600" />
                              </div>
                              <span className="tracking-wider">工作台</span>
                            </div>
                          </div>
                          {/* 笔记区域 */}
                          <div className={`h-[calc(100%-3px-34%)] bg-gradient-to-b from-blue-50/60 to-blue-100/80 dark:from-blue-800/20 dark:to-blue-900/30
                            flex items-center justify-center text-[6px] font-semibold text-blue-500 dark:text-blue-400
                            transition-all duration-500 delay-200
                            ${homeLayout === 'combined' ? 'opacity-100' : 'opacity-40'}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="tracking-wider">笔记</span>
                              <div className="flex gap-0.5">
                                <div className="w-1.5 h-1 rounded-[1px] bg-blue-300 dark:bg-blue-600" />
                                <div className="w-1.5 h-1 rounded-[1px] bg-blue-300 dark:bg-blue-600" />
                                <div className="w-1.5 h-1 rounded-[1px] bg-blue-300 dark:bg-blue-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* 选中时 snap 动效 */}
                        {homeLayout === 'combined' && (
                          <>
                            <div className="absolute inset-0 border-2 border-accent rounded-lg animate-pulse pointer-events-none" style={{ animationDuration: '1.5s' }} />
                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            homeLayout === 'combined'
                              ? 'border-accent bg-accent scale-110'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {homeLayout === 'combined' && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">合并一页</div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                          工作台与笔记详情在同一页面，模块间带加载动效过渡
                        </p>
                        <div className="mt-2 ml-6 flex gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-50 dark:bg-red-900/30 text-red-500 font-medium">
                            ⌨ 工作台
                          </span>
                          <span className="text-[9px] text-gray-300 dark:text-gray-600 self-center">+</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-500 font-medium">
                            📋 笔记
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* 分两页 — 模拟 Win+←/→ 并排分屏 */}
                  <label
                    onClick={() => setHomeLayout('separated')}
                    className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      homeLayout === 'separated'
                        ? 'border-accent bg-accent-50 dark:bg-accent-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 动效预览 — 两个窗口并排 */}
                      <div className="relative w-28 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                        {/* 左侧窗口：首页 */}
                        <div className={`absolute left-1 top-1 bottom-1 w-[38%]
                          rounded-[3px] border overflow-hidden
                          transition-all duration-600 ease-out
                          ${homeLayout === 'separated'
                            ? 'border-gray-300 dark:border-gray-500 opacity-100 translate-x-0'
                            : 'border-gray-200 dark:border-gray-700 opacity-40 -translate-x-1'
                          }`}
                          style={homeLayout === 'separated'
                            ? { boxShadow: '1px 0 5px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)' }
                            : {}}>
                          {/* 标题栏 */}
                          <div className="h-2.5 bg-gradient-to-r from-red-200 to-red-100 dark:from-red-800/60 dark:to-red-700/40 flex items-center px-1">
                            <div className="w-0.5 h-0.5 rounded-full bg-red-500 dark:bg-red-400 mr-0.5" />
                            <span className="text-[4px] font-bold text-red-700 dark:text-red-300">首页</span>
                          </div>
                          {/* 内容模拟 */}
                          <div className="h-[calc(100%-10px)] bg-white/80 dark:bg-gray-700/60 flex flex-col items-center justify-center gap-0.5 text-[5px] text-red-500 dark:text-red-400">
                            <div className="w-4 h-2 rounded-[1px] bg-red-100 dark:bg-red-900/40" />
                            <div className="w-3 h-1.5 rounded-[1px] bg-red-100 dark:bg-red-900/40" />
                            <span>工作台</span>
                          </div>
                        </div>
                        {/* 右侧窗口：笔记 */}
                        <div className={`absolute right-1 top-1 bottom-1 w-[38%]
                          rounded-[3px] border overflow-hidden
                          transition-all duration-600 ease-out
                          ${homeLayout === 'separated'
                            ? 'border-gray-300 dark:border-gray-500 opacity-100 translate-x-0'
                            : 'opacity-40 translate-x-1'
                          }`}
                          style={homeLayout === 'separated'
                            ? { boxShadow: '-1px 0 5px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)' }
                            : {}}>
                          {/* 标题栏 */}
                          <div className="h-2.5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-700/40 dark:to-blue-800/60 flex items-center px-1">
                            <div className="w-0.5 h-0.5 rounded-full bg-blue-500 dark:bg-blue-400 mr-0.5" />
                            <span className="text-[4px] font-bold text-blue-700 dark:text-blue-300">笔记</span>
                          </div>
                          {/* 内容模拟 */}
                          <div className="h-[calc(100%-10px)] bg-white/80 dark:bg-gray-700/60 flex flex-col items-center justify-center gap-0.5 text-[5px] text-blue-500 dark:text-blue-400">
                            <div className="flex gap-0.5">
                              <div className="w-1.5 h-1.5 rounded-[1px] bg-blue-100 dark:bg-blue-900/40" />
                              <div className="w-1.5 h-1.5 rounded-[1px] bg-blue-100 dark:bg-blue-900/40" />
                            </div>
                            <div className="w-3 h-1 rounded-[1px] bg-blue-100 dark:bg-blue-900/40" />
                            <span>全部笔记</span>
                          </div>
                        </div>
                        {/* 中间间隙 + 半透明 snap 叠加指示 */}
                        <div className="absolute left-1/2 top-1 bottom-1 w-[18%] flex items-center justify-center text-[6px] text-gray-400 font-medium">
                          {homeLayout === 'separated' && (
                            <div className="animate-pulse text-accent" style={{ animationDuration: '1.8s' }}>▮▮</div>
                          )}
                        </div>
                        {/* 选中标记 */}
                        {homeLayout === 'separated' && (
                          <>
                            <div className="absolute inset-0 border-2 border-accent rounded-lg animate-pulse pointer-events-none" style={{ animationDuration: '1.5s' }} />
                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            homeLayout === 'separated'
                              ? 'border-accent bg-accent scale-110'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {homeLayout === 'separated' && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">分两页</div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                          首页仅展示工作台与欢迎页面，笔记详情独立为单独页面
                        </p>
                        <div className="mt-2 ml-6 flex gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-50 dark:bg-red-900/30 text-red-500 font-medium">
                            🏠 首页
                          </span>
                          <span className="text-[9px] text-gray-300 dark:text-gray-600 self-center">→</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-500 font-medium">
                            📋 笔记页
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>

                  <button
                    onClick={handleSaveHomeLayout}
                    className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Save size={18} />
                    保存布局
                  </button>
                </div>
              </div>
            )}

            {/* 外观设置 */}
            {activeTab === 'appearance' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <ThemeCustomizer />
              </div>
            )}

            {/* 插件管理 */}
            {activeTab === 'plugins' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Puzzle size={20} className="text-accent-500" />
                        插件管理
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        管理已安装的功能插件，核心插件不可停用
                      </p>
                    </div>
                    <button
                      onClick={loadPlugins}
                      disabled={loadingPlugins}
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {loadingPlugins ? '加载中...' : '刷新'}
                    </button>
                  </div>

                  {/* 插件架构说明 */}
                  <div className="mb-4 p-3 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800">
                    <p className="text-sm text-accent-700 dark:text-accent-300">
                      微内核架构 · {installedPlugins.filter(p => p.status === 'active').length} 个活跃插件 · EventBus 通信 · 动态路由
                    </p>
                  </div>

                  {/* 插件列表 */}
                  <div className="space-y-3">
                    {installedPlugins.map(plugin => (
                      <div
                        key={plugin.id}
                        className={`p-4 rounded-lg border transition-all ${
                          plugin.status === 'active'
                            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                            plugin.type === 'core'
                              ? 'bg-accent-100 dark:bg-accent-900/40'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {plugin.type === 'core' ? '📝' :
                              plugin.id.includes('ai') ? '🤖' :
                              plugin.id.includes('password') ? '🔐' :
                              plugin.id.includes('kanban') ? '📋' :
                              plugin.id.includes('memo') ? '📌' : '🧩'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{plugin.name}</span>
                              {plugin.required && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 rounded">
                                  核心
                                </span>
                              )}
                              {plugin.status === 'active' ? (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded">
                                  <CheckCircle2 size={10} />
                                  运行中
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded">
                                  <XCircle size={10} />
                                  已停用
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {plugin.id} · {plugin.type === 'core' ? '核心模块' : '功能插件'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!plugin.required && (
                            <button
                              type="button"
                              onClick={() => handleTogglePlugin(plugin.id, plugin.status)}
                              disabled={togglingPlugin === plugin.id}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                                plugin.status === 'active'
                                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                                  : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                              } disabled:opacity-50`}
                            >
                              {togglingPlugin === plugin.id ? (
                                <span className="animate-pulse">处理中...</span>
                              ) : plugin.status === 'active' ? (
                                <><PowerOff size={12} /> 停用</>
                              ) : (
                                <><Power size={12} /> 启用</>
                              )}
                            </button>
                          )}
                        </div>
                        </div>

                        {/* 插件功能预览 */}
                        {(() => {
                          const info = PLUGIN_INFO[plugin.id];
                          if (!info) return null;
                          return (
                            <div className={`mt-3 p-3 rounded-lg border transition-all ${
                              plugin.status === 'active'
                                ? 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
                                : 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 opacity-60'
                            }`}>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{info.desc}</p>
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                {info.features.map(f => (
                                  <span key={f} className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${info.tagClass}`}>
                                    {f}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                                <span>📍</span>
                                {info.routes.map((r, i) => (
                                  <span key={i} className="font-mono">{r}{i < info.routes.length - 1 ? ' · ' : ''}</span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 内核状态 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">🔧 微内核状态</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { name: 'EventBus', desc: '事件总线', status: true },
                      { name: 'PluginRouter', desc: '动态路由', status: true },
                      { name: 'PluginShell', desc: 'UI Shell', status: true },
                      { name: 'CommandBar', desc: '命令栏', status: true },
                    ].map(item => (
                      <div key={item.name} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle size={12} className={item.status ? 'text-green-500' : 'text-red-500'} />
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{item.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
