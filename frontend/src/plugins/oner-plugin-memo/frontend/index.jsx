/**
 * oner-plugin-memo — 智能备忘插件入口
 *
 * 注意：/memos 路由已在 App.jsx 中作为静态路由保留，
 * 此处仅注册侧边栏和命令面板入口。
 */
export default function memoPlugin(ctx) {
  // 添加侧边栏入口
  ctx.shell.addSidebarItem({
    id: 'memo-main',
    label: '备忘',
    icon: 'BookMarked',
    path: '/memos',
    priority: 90,
  });

  // 注册命令
  ctx.commandbar.register('memo.quick', {
    title: '快速备忘',
    icon: 'Zap',
    shortcut: 'Ctrl+M',
    action: () => {
      window.location.href = '/memos';
    },
  });
}
