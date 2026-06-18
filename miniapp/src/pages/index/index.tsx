import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro';
import PluginCard from '../../components/plugin-card';
import DownloadBar from '../../components/download-bar';
import { api, setToken } from '../../api';
import './index.less';

// 插件列表配置 - 有预览页面的
const PREVIEW_PLUGINS = [
  { icon: '📝', name: '笔记', desc: '记录灵感、管理待办', features: ['笔记管理', '待办事项', '分类筛选'], path: '/pages/notes/index' },
  { icon: '🤖', name: 'AI 助手', desc: '智能对话、内容润色', features: ['AI对话', '智能分析'], path: '/pages/ai/index' },
  { icon: '📋', name: '看板', desc: '泳道看板、拖拽管理', features: ['泳道视图', '状态流转'], path: '/pages/kanban/index' },
  { icon: '🔐', name: '密码库', desc: '安全存储密码', features: ['密码管理', '加密存储'], path: '/pages/passwords/index' },
  { icon: '📌', name: '备忘', desc: '快速记录碎片信息', features: ['时间线', '快速记录'], path: '/pages/memos/index' },
];

// 仅 App 端可用的插件
const APP_ONLY_PLUGINS = [
  { icon: '🧩', name: '思维导图', desc: '可视化思路整理', features: ['节点编辑', '导出分享'] },
  { icon: '📊', name: '看板统计', desc: '任务进度分析', features: ['泳道视图', '状态流转'] },
  { icon: '🔍', name: '全局搜索', desc: '跨模块全文检索', features: ['笔记搜索', '备忘搜索', '密码搜索'] },
  { icon: '📅', name: '日程管理', desc: '日历视图任务规划', features: ['日程安排', '提醒通知', '周视图/月视图'] },
  { icon: '🔄', name: '数据同步', desc: '多端实时同步', features: ['云端同步', '离线访问', '版本历史'] },
];

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ notes: 0, todos: 0 });

  // 动态分享：标题带统计数据，增加吸引力
  useShareAppMessage(() => ({
    title: user
      ? `我在 Oner 管理了 ${stats.notes} 篇笔记、${stats.todos} 个待办，快来试试！`
      : 'Oner - 笔记·AI·看板·密码库·备忘，你的效率工作台',
    path: '/pages/index/index',
    imageUrl: '/assets/share-cover.svg',
  }));

  useShareTimeline(() => ({
    title: 'Oner - 你的效率工作台',
    imageUrl: '/assets/share-cover.svg',
  }));

  useEffect(() => {
    // 尝试自动登录（wx.login）
    handleLogin();
  }, []);

  const handleLogin = async () => {
    try {
      const { code } = await Taro.login();
      const res = await api.auth.miniLogin(code);
      setToken(res.token);
      setUser(res.user);
      // 加载统计数据
      const notesRes = await api.notes.list({ limit: 100 });
      const all = notesRes?.data?.notes || notesRes?.data || [];
      setStats({
        notes: all.filter(n => n.status === 'note' || !n.status).length,
        todos: all.filter(n => n.status === 'todo' || n.status === 'in_progress').length,
      });
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <ScrollView className='page-index' scrollY>
      {/* 欢迎区域 */}
      <View className='welcome'>
        <Text className='welcome__title'>Oner</Text>
        <Text className='welcome__subtitle'>你的效率工作台</Text>
      </View>

      {/* 统计预览 */}
      {user && (
        <View className='stats'>
          <View className='stats__item'>
            <Text className='stats__num'>{stats.notes}</Text>
            <Text className='stats__label'>笔记</Text>
          </View>
          <View className='stats__divider' />
          <View className='stats__item'>
            <Text className='stats__num'>{stats.todos}</Text>
            <Text className='stats__label'>待办</Text>
          </View>
          <View className='stats__divider' />
          <View className='stats__item'>
            <Text className='stats__num'>{PREVIEW_PLUGINS.length}</Text>
            <Text className='stats__label'>功能模块</Text>
          </View>
        </View>
      )}

      {/* 功能模块列表（可预览） */}
      <View className='section'>
        <Text className='section__title'>功能预览</Text>
        <Text className='section__desc'>点击查看各模块内容预览</Text>
        {PREVIEW_PLUGINS.map((p) => (
          <PluginCard key={p.name} {...p} />
        ))}
      </View>

      {/* 提醒设置入口 */}
      <View className='section'>
        <View className='notif-entry' onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })}>
          <View className='notif-entry__icon'>🔔</View>
          <View className='notif-entry__info'>
            <Text className='notif-entry__title'>微信提醒设置</Text>
            <Text className='notif-entry__desc'>待办到期 / 备忘回执 / 每日汇总</Text>
          </View>
          <Text className='notif-entry__arrow'>›</Text>
        </View>

        <View className='notif-entry' onClick={() => Taro.navigateTo({ url: '/pages/share/index' })}>
          <View className='notif-entry__icon'>🔗</View>
          <View className='notif-entry__info'>
            <Text className='notif-entry__title'>邀请好友</Text>
            <Text className='notif-entry__desc'>生成专属小程序码，邀请朋友体验</Text>
          </View>
          <Text className='notif-entry__arrow'>›</Text>
        </View>
      </View>

      {/* App 端专属插件预告 */}
      <View className='section'>
        <Text className='section__title'>更多插件 • 下载解锁</Text>
        <Text className='section__desc'>App 端更有多款专属插件等您体验</Text>
        <View className='app-plugins-grid'>
          {APP_ONLY_PLUGINS.map((p) => (
            <View key={p.name} className='app-plugins-grid__item'>
              <Text className='app-plugins-grid__icon'>{p.icon}</Text>
              <Text className='app-plugins-grid__name'>{p.name}</Text>
            </View>
          ))}
        </View>
        <DownloadBar text='下载 Oner App，体验完整插件生态：思维导图、日程管理、数据同步……' />
      </View>

      <View style='height: 32px' />
    </ScrollView>
  );
}
