import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Monitor, LogOut, Save, Trash2, ArrowLeft, Palette, Keyboard, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import ThemeCustomizer from '../components/ThemeCustomizer';

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
    if (activeTab === 'shortcuts' || activeTab === 'password-settings') {
      loadSettings();
    }
    if (activeTab === 'vault-pin') {
      checkVaultPin();
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

  // 加载设置（快捷键+密码设置）
  const loadSettings = async () => {
    try {
      const res = await api.settings.get();
      const settings = res.data || {};
      setShortcuts(settings.shortcuts || DEFAULT_SHORTCUTS);
      setPasswordIncludeInSearch(settings.passwordDefaults?.includeInSearch ?? false);
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
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'password', label: '修改密码', icon: Lock },
    { id: 'shortcuts', label: '快捷键', icon: Keyboard },
    { id: 'vault-pin', label: '密码库PIN', icon: KeyRound },
    { id: 'password-settings', label: '密码设置', icon: Lock },
    { id: 'appearance', label: '外观', icon: Palette },
    { id: 'devices', label: '设备管理', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">用户中心</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 侧边栏 */}
          <div className="md:w-48">
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

            {/* 外观设置 */}
            {activeTab === 'appearance' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <ThemeCustomizer />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
