export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/notes/index',
    'pages/ai/index',
    'pages/kanban/index',
    'pages/passwords/index',
    'pages/memos/index',
    'pages/notifications/index',
    'pages/share/index',
  ],
  window: {
    navigationBarTitleText: 'Oner',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5',
  },
  // 分享到好友/群（全局默认，各页面可覆盖）
  onShareAppMessage: () => ({
    title: 'Oner - 你的效率工作台',
    path: '/pages/index/index',
    imageUrl: '/assets/share-cover.svg',
  }),
});
