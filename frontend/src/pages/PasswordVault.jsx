import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Eye, EyeOff, Trash2, Search as SearchIcon,
  ToggleLeft, ToggleRight, Lock, Globe, Key, Tag, Settings2,
  Copy, Check, Shield, ShieldOff, X, Loader2
} from 'lucide-react';
import usePasswords from '../hooks/usePasswords';
import { api } from '../utils/api';
import CategoryManager from '../components/CategoryManager';

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]
        text-gray-400 hover:text-accent hover:bg-accent/5 transition-all"
      title={`复制${label}`}
    >
      {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
      {copied ? '已复制' : label}
    </button>
  );
}

export default function PasswordVault() {
  const navigate = useNavigate();
  const { entries, loading, fetchEntries, createEntry, updateEntry, deleteEntry, decryptPassword, toggleSearch } = usePasswords();
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', url: '', username: '', password: '', notes: '', category: '' });
  const [decryptedPasswords, setDecryptedPasswords] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // PIN 二次认证
  const [needsPin, setNeedsPin] = useState(null); // null=检查中, true=需PIN, false=已认证
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const pinInputRef = useRef(null);

  // 新建分类（内联）
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  // 加载分类
  const loadCategories = useCallback(() => {
    api.categories.list().then(res => setCategories(res.data?.categories || [])).catch(() => {});
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // 按分类加载密码
  const loadEntries = useCallback((cat) => {
    fetchEntries(cat ? { category: cat } : {});
  }, [fetchEntries]);

  useEffect(() => { loadEntries(activeCategory); }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // 检查 PIN 状态（三态：null=检查中, true=需PIN, false=已认证）
  useEffect(() => {
    const checkPin = async () => {
      try {
        const res = await api.settings.get();
        const settings = res.data || {};
        if (settings.vault_pin_hash) {
          const vaultToken = sessionStorage.getItem('vault_token');
          if (!vaultToken) {
            setNeedsPin(true);
            return;
          }
        }
        setNeedsPin(false);
      } catch {
        setNeedsPin(false);
      }
    };
    checkPin();
  }, []);

  // PIN 验证
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinValue.trim()) return;
    setPinLoading(true);
    setPinError('');
    try {
      const res = await api.auth.verifyVaultPin(pinValue.trim());
      // 存储在 sessionStorage，页面关闭后失效
      sessionStorage.setItem('vault_token', res.data.vault_token);
      setNeedsPin(false);
      setPinValue('');
    } catch (err) {
      setPinError(err.message || 'PIN 码错误');
    } finally {
      setPinLoading(false);
      pinInputRef.current?.focus();
    }
  };

  // 解密密码（10秒后自动重置）
  const handleShowPassword = useCallback(async (id) => {
    if (decryptedPasswords[id]) {
      setDecryptedPasswords(prev => ({ ...prev, [id]: null }));
      return;
    }
    try {
      const pw = await decryptPassword(id);
      setDecryptedPasswords(prev => ({ ...prev, [id]: pw }));
      setTimeout(() => {
        setDecryptedPasswords(prev => ({ ...prev, [id]: null }));
      }, 10000);
    } catch (err) {
      console.error(err);
    }
  }, [decryptPassword, decryptedPasswords]);

  // 创建/更新
  const handleSave = async () => {
    if (!form.password && !editingId) return;
    try {
      if (editingId) {
        await updateEntry(editingId, form);
      } else {
        await createEntry(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ title: '', url: '', username: '', password: '', notes: '', category: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (entry) => {
    setForm({ title: entry.title, url: entry.url, username: entry.username, password: '', notes: entry.notes || '', category: entry.category || '' });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此密码条目？')) return;
    try { await deleteEntry(id); }
    catch (err) { console.error(err); }
  };

  // 内联创建分类
  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const res = await api.categories.create({ name, color: newCategoryColor });
      setForm(prev => ({ ...prev, category: name }));
      setNewCategoryName('');
      setShowNewCategory(false);
      loadCategories();
    } catch (err) {
      console.error('Create category error:', err);
    }
  };

  // 搜索过滤
  const filtered = entries.filter(e =>
    !searchQuery
    || e.title?.toLowerCase().includes(searchQuery.toLowerCase())
    || e.url?.toLowerCase().includes(searchQuery.toLowerCase())
    || e.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ======== 加载中（检查 PIN 状态）========
  if (needsPin === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // ======== PIN 验证界面 ========
  if (needsPin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
              <Shield size={24} className="text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">二次认证</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              请输入密码库 PIN 码以继续
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                ref={pinInputRef}
                type="password"
                value={pinValue}
                onChange={e => setPinValue(e.target.value)}
                placeholder="输入 PIN 码"
                maxLength={20}
                autoFocus
                className="w-full px-4 py-3 text-lg tracking-widest text-center
                  bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
                  text-gray-900 dark:text-gray-100 outline-none
                  focus:ring-2 focus:ring-accent-500/30 focus:border-accent/40
                  placeholder-gray-400"
              />
              {pinError && (
                <p className="mt-2 text-sm text-red-500 text-center">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!pinValue.trim() || pinLoading}
              className="w-full py-3 bg-accent text-white rounded-xl font-medium
                hover:bg-accent-600 disabled:opacity-50 transition-colors
                flex items-center justify-center gap-2"
            >
              {pinLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Shield size={18} />
              )}
              {pinLoading ? '验证中...' : '验证'}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              返回
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ======== 正常内容 ========
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <Lock size={20} className="text-purple-500" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">密码备忘</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
              PIN 已认证
            </span>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', url: '', username: '', password: '', notes: '', category: '' }); }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent-600 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> 新增
          </button>
        </div>

        {/* 分类标签栏 */}
        <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveCategory(null)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              !activeCategory
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-300 dark:ring-purple-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Lock size={12} />
            全部PIN
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.name
                  ? 'text-white ring-2 ring-offset-1 dark:ring-offset-gray-950'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}
            >
              <Tag size={12} />
              {cat.name}
              {activeCategory === cat.name && (
                <span
                  className="ml-0.5 opacity-70 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); setActiveCategory(null); }}
                >×</span>
              )}
            </button>
          ))}
          <button
            onClick={() => setShowCategoryManager(true)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium
              bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
            title="管理分类"
          >
            <Settings2 size={12} />
            分类
          </button>
        </div>

        {/* 搜索 */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeCategory ? `在「${activeCategory}」中搜索 网址/密码/用户名...` : '搜索 网址/密码/用户名...'}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-accent-500/30"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeCategory && (
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
            <span>当前分类:</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
              {activeCategory}
            </span>
            <span className="ml-auto">{filtered.length} 条记录</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Lock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? '未找到匹配的条目' : activeCategory ? `「${activeCategory}」分类下暂无密码` : '还没有密码条目'}
            </p>
            {!activeCategory && !searchQuery && (
              <button
                onClick={() => { setShowForm(true); setForm({ title: '', url: '', username: '', password: '', notes: '', category: '' }); }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors"
              >
                <Plus size={16} /> 添加第一个密码
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(entry => (
              <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* 标题行 */}
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-purple-400 shrink-0" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{entry.title || '(无标题)'}</h3>
                      {entry.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shrink-0">
                          {entry.category}
                        </span>
                      )}
                    </div>

                    {/* URL 行 + 快捷复制 */}
                    {entry.url && (
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate max-w-[300px]">{entry.url}</span>
                        <CopyButton text={entry.url} label="网址" />
                      </div>
                    )}

                    {/* 用户名 + 快捷复制 */}
                    {entry.username && (
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <Key size={10} className="shrink-0" />
                        <span>{entry.username}</span>
                        <CopyButton text={entry.username} label="用户名" />
                      </div>
                    )}

                    {/* 密码 + 快捷复制 */}
                    <div className="flex items-center gap-2 mt-1.5 text-sm font-mono">
                      {decryptedPasswords[entry.id] ? (
                        <span className="text-gray-900 dark:text-gray-100">{decryptedPasswords[entry.id]}</span>
                      ) : (
                        <span className="text-gray-400">••••••••</span>
                      )}
                      {decryptedPasswords[entry.id] && (
                        <CopyButton text={decryptedPasswords[entry.id]} label="密码" />
                      )}
                    </div>

                    {/* 备注 */}
                    {entry.notes && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2.5 py-1.5 line-clamp-2">
                        {entry.notes}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 shrink-0 ml-3 mt-1">
                    <button
                      onClick={() => handleShowPassword(entry.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={decryptedPasswords[entry.id] ? '隐藏密码' : '显示密码'}
                    >
                      {decryptedPasswords[entry.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSearch(entry.id, !entry.include_in_search)}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                        entry.include_in_search ? 'text-accent-500' : 'text-gray-400'
                      }`}
                      title={entry.include_in_search ? '已纳入全局搜索' : '未纳入全局搜索'}
                    >
                      <Globe size={16} />
                    </button>
                    <button onClick={() => handleEdit(entry)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="编辑">
                      <Key size={16} />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors" title="删除">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 创建/编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => { setShowForm(false); setShowNewCategory(false); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingId ? '编辑密码' : '新增密码'}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <input type="text" placeholder="标题" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-accent-500/30" />
              <input type="text" placeholder="网址 (可选)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-accent-500/30" />
              <input type="text" placeholder="用户名" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-accent-500/30" />
              <input type="password" placeholder={editingId ? '新密码 (留空不修改)' : '密码'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-accent-500/30" />
              <textarea placeholder="备注 (可选)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-accent-500/30 resize-none" />

              {/* 分类选择 + 内联新建 */}
              <div className="space-y-1.5">
                <select value={form.category} onChange={e => {
                  if (e.target.value === '__new__') {
                    setShowNewCategory(true);
                  } else {
                    setForm({ ...form, category: e.target.value });
                    setShowNewCategory(false);
                  }
                }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-accent-500/30">
                  <option value="">无分类</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  <option value="__new__">+ 新建分类</option>
                </select>
                {showNewCategory && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder="分类名称"
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-accent-500/30"
                      autoFocus
                    />
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={e => setNewCategoryColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 transition-colors"
                    >
                      创建
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setShowNewCategory(false); }} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">取消</button>
              <button onClick={handleSave} disabled={!form.password && !editingId}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 transition-colors">
                {editingId ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分类管理弹窗 */}
      {showCategoryManager && (
        <CategoryManager
          isOpen={showCategoryManager}
          onClose={() => { setShowCategoryManager(false); loadCategories(); }}
          onCategoryChange={() => { loadCategories(); loadEntries(activeCategory); }}
        />
      )}
    </div>
  );
}
