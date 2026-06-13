/**
 * @oner/plugin-core-notes — 前端入口
 *
 * 由 PluginManager 在激活时调用，接收 ctx（插件上下文）
 * 负责：注册路由、注册侧边栏、注册命令栏、注册 UI 组件
 */

import NotesPage from './pages/NotesPage';
import NoteEditor from './pages/NoteEditor';

export default {
  /**
   * 激活时调用
   * @param {Object} ctx - 插件上下文
   * @param {Object} ctx.kernel - 内核能力（DB、EventBus、UI Shell 等）
   * @param {Object} ctx.config - 当前用户配置
   */
  async activate(ctx) {
    console.log('[core-notes] activating...');

    // 1. 注册路由（由 Router 接管）
    ctx.kernel.router.addRoute({
      path: '/notes',
      component: NotesPage,
      exact: true
    });
    ctx.kernel.router.addRoute({
      path: '/notes/:id',
      component: NoteEditor
    });

    // 2. 注册侧边栏入口
    ctx.kernel.shell.addSidebarItem({
      id: 'core-notes',
      label: '笔记',
      icon: 'FileText',
      path: '/notes',
      priority: 100,
      slot: 'sidebar.main'
    });

    // 3. 注册命令栏快捷命令
    ctx.kernel.commandbar.register({
      id: 'note.create',
      title: '新建笔记',
      icon: 'Plus',
      shortcut: 'Ctrl+N',
      handler: () => ctx.kernel.router.navigate('/notes?action=create')
    });

    ctx.kernel.commandbar.register({
      id: 'note.search',
      title: '搜索笔记',
      icon: 'Search',
      shortcut: 'Ctrl+K',
      handler: () => ctx.kernel.commandbar.open()
    });

    // 4. 暴露 API 给其他插件
    ctx.api.notes = {
      list: (filters) => this._api.notes.list(filters),
      get: (id) => this._api.notes.get(id),
      create: (data) => this._api.notes.create(data),
      update: (id, data) => this._api.notes.update(id, data),
      delete: (id) => this._api.notes.delete(id),
      onChange: (callback) => ctx.kernel.eventBus.on('notes:changed', callback)
    };

    ctx.api.categories = {
      list: () => this._api.categories.list(),
      tree: () => this._api.categories.tree(),
      create: (data) => this._api.categories.create(data),
      update: (id, data) => this._api.categories.update(id, data),
      delete: (id) => this._api.categories.delete(id)
    };

    ctx.api.tags = {
      list: () => this._api.tags.list(),
      suggest: (prefix) => this._api.tags.suggest(prefix)
    };

    // 5. 注册生命周期 hook
    ctx.kernel.eventBus.on('user:logout', () => {
      console.log('[core-notes] clearing local cache...');
    });

    console.log('[core-notes] activated');
  },

  /**
   * 停用时调用
   */
  async deactivate(ctx) {
    console.log('[core-notes] deactivating...');

    // 移除路由
    ctx.kernel.router.removeRoute('/notes');
    ctx.kernel.router.removeRoute('/notes/:id');

    // 移除侧边栏
    ctx.kernel.shell.removeSidebarItem('core-notes');

    // 移除命令
    ctx.kernel.commandbar.unregister('note.create');
    ctx.kernel.commandbar.unregister('note.search');

    // 清空 API 引用
    delete ctx.api.notes;
    delete ctx.api.categories;
    delete ctx.api.tags;

    console.log('[core-notes] deactivated');
  },

  // 内部 API 实现（私有）
  _api: {
    notes: {
      async list(filters = {}) {
        const params = new URLSearchParams(filters);
        const res = await fetch(`/api/notes?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
      },
      async get(id) {
        const res = await fetch(`/api/notes/${id}`);
        return res.json();
      },
      async create(data) {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      async update(id, data) {
        const res = await fetch(`/api/notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      async delete(id) {
        const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        return res.json();
      }
    },
    categories: {
      async list() { return fetch('/api/categories').then(r => r.json()); },
      async tree() { return fetch('/api/categories/tree').then(r => r.json()); },
      async create(data) {
        return fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(r => r.json());
      },
      async update(id, data) {
        return fetch(`/api/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(r => r.json());
      },
      async delete(id) {
        return fetch(`/api/categories/${id}`, { method: 'DELETE' }).then(r => r.json());
      }
    },
    tags: {
      async list() { return fetch('/api/tags').then(r => r.json()); },
      async suggest(prefix) {
        return fetch(`/api/tags/suggest?prefix=${prefix}`).then(r => r.json());
      }
    }
  }
};
