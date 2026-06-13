/**
 * @oner/plugin-password — 密码保险库插件入口
 */

// 迁移阶段：引用现有页面
import PasswordVault from '../../../pages/PasswordVault';

export default {
  async activate(ctx) {
    console.log('[password] activating...');

    // 1. 注册路由
    ctx.kernel.router.addRoute({
      path: '/passwords',
      component: PasswordVault,
      exact: true,
    });

    // 2. 注册侧边栏
    ctx.kernel.shell.addSidebarItem({
      id: 'password-vault',
      label: '密码库',
      icon: 'Lock',
      path: '/passwords',
      priority: 60,
    });

    // 3. 注册命令
    ctx.kernel.commandbar.register({
      id: 'password.generate',
      title: '生成强密码',
      icon: 'Key',
      shortcut: 'Ctrl+Shift+P',
      handler: () => {
        const password = ctx.api.password.generate();
        navigator.clipboard.writeText(password);
        ctx.kernel.eventBus.emit('toast:show', { message: '密码已复制', type: 'success' });
      },
    });

    // 4. 暴露 API
    ctx.api.password = {
      generate: (options = {}) => {
        const length = options.length || ctx.config.passwordLength?.default || 16;
        const includeSymbols = options.includeSymbols ?? ctx.config.includeSymbols?.default ?? true;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + (includeSymbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '');
        let password = '';
        for (let i = 0; i < length; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      },
      list: async () => {
        const res = await fetch('/api/passwords', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return res.json();
      },
      save: async (data) => {
        const res = await fetch('/api/passwords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(data),
        });
        return res.json();
      },
    };

    console.log('[password] activated');
  },

  async deactivate(ctx) {
    console.log('[password] deactivating...');
    ctx.kernel.router.removeRoute('/passwords');
    ctx.kernel.shell.removeSidebarItem('password-vault');
    ctx.kernel.commandbar.unregister('password.generate');
    delete ctx.api.password;
    console.log('[password] deactivated');
  },
};
