/**
 * @oner/plugin-kanban — 看板视图插件入口
 */

// 迁移阶段：引用现有页面
import BoardPage from '../../../pages/BoardPage';

export default {
  async activate(ctx) {
    console.log('[kanban] activating...');

    // 1. 注册路由
    ctx.kernel.router.addRoute({
      path: '/board',
      component: BoardPage,
      exact: true,
    });

    // 2. 注册侧边栏
    ctx.kernel.shell.addSidebarItem({
      id: 'kanban-board',
      label: '看板',
      icon: 'Columns',
      path: '/board',
      priority: 90,
    });

    // 3. 注册命令
    ctx.kernel.commandbar.register({
      id: 'board.open',
      title: '打开看板',
      icon: 'Columns',
      handler: () => ctx.kernel.router.navigate('/board'),
    });

    // 4. 暴露 API
    ctx.api.kanban = {
      getColumns: () => ctx.config.columns?.default || ['memo', 'todo', 'in_progress', 'done'],
      moveCard: async (noteId, fromColumn, toColumn) => {
        // 通过核心笔记插件更新状态
        const notesApi = ctx.plugins['oner.plugin.core-notes']?.api?.notes;
        if (notesApi) {
          await notesApi.update(noteId, { status: toColumn });
          ctx.kernel.eventBus.emit('kanban:card-moved', { noteId, fromColumn, toColumn });
        }
      },
    };

    // 5. 监听笔记变更，刷新看板
    ctx.kernel.eventBus.on('notes:changed', () => {
      ctx.kernel.eventBus.emit('kanban:refresh');
    });

    console.log('[kanban] activated');
  },

  async deactivate(ctx) {
    console.log('[kanban] deactivating...');
    ctx.kernel.router.removeRoute('/board');
    ctx.kernel.shell.removeSidebarItem('kanban-board');
    ctx.kernel.commandbar.unregister('board.open');
    delete ctx.api.kanban;
    console.log('[kanban] deactivated');
  },
};
