/**
 * @oner/plugin-ai — AI 智能助手插件入口
 */

// 迁移阶段：引用现有页面，后续替换为插件内页面
import AIChat from '../../../pages/AIChat';

export default {
  async activate(ctx) {
    console.log('[ai] activating...');

    // 1. 注册路由
    ctx.kernel.router.addRoute({
      path: '/ai',
      component: AIChat,
      exact: true,
    });

    // 2. 注册侧边栏
    ctx.kernel.shell.addSidebarItem({
      id: 'ai-chat',
      label: 'AI 助手',
      icon: 'Sparkles',
      path: '/ai',
      priority: 80,
    });

    // 3. 注册命令
    ctx.kernel.commandbar.register({
      id: 'ai.chat',
      title: 'AI 对话',
      icon: 'Sparkles',
      shortcut: 'Ctrl+I',
      handler: () => ctx.kernel.router.navigate('/ai'),
    });

    ctx.kernel.commandbar.register({
      id: 'ai.polish',
      title: 'AI 润色当前笔记',
      icon: 'Wand2',
      handler: () => ctx.kernel.eventBus.emit('ai:polish-requested'),
    });

    // 4. 暴露 API 给其他插件
    ctx.api.ai = {
      chat: async (messages, options) => {
        // 调用后端 AI 接口
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ messages, ...options }),
        });
        return response.json();
      },
      polish: async (content) => {
        const response = await fetch('/api/ai/polish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ content }),
        });
        return response.json();
      },
      summarize: async (content) => {
        const response = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ content }),
        });
        return response.json();
      },
    };

    // 5. 监听笔记保存事件，触发 AI 建议
    ctx.kernel.eventBus.on('notes:saved', (note) => {
      console.log('[ai] Note saved, can suggest next actions');
    });

    console.log('[ai] activated');
  },

  async deactivate(ctx) {
    console.log('[ai] deactivating...');
    ctx.kernel.router.removeRoute('/ai');
    ctx.kernel.shell.removeSidebarItem('ai-chat');
    ctx.kernel.commandbar.unregister('ai.chat');
    ctx.kernel.commandbar.unregister('ai.polish');
    delete ctx.api.ai;
    console.log('[ai] deactivated');
  },
};
