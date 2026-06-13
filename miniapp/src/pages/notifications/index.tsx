import { View, Text, ScrollView, Switch, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { api } from '../../api';
import './index.less';

// 微信订阅消息模板 ID（需在微信小程序后台配置）
// 在公共模板库搜索「待办提醒」「任务通知」等获取
const TEMPLATES = {
  todo_due: { id: '', name: '待办到期提醒', desc: '待办事项到期时推送微信通知' },
};

export default function NotificationsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res: any = await api.wechat.subscriptions();
      setSubs(res?.data?.subscriptions || res?.subscriptions || []);
    } catch (err) {
      console.error('加载订阅失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 请求订阅
  const handleSubscribe = async (remindType: string) => {
    setSubscribing(true);
    try {
      // 获取模板 ID：优先使用环境变量，其次本地配置
      const tmplId = process.env.TARO_APP_WX_TMPL_TODO_DUE || TEMPLATES[remindType]?.id;

      // 微信订阅消息 API
      const { ermsg } = await Taro.requestSubscribeMessage({
        tmplIds: [tmplId],
      });

      // 用户同意订阅后保存到后端
      const { code } = await Taro.login();
      // 用 code 换 openid（后端 mini-login 已处理）
      const loginRes: any = await api.auth.miniLogin(code);
      const openid = loginRes?.data?.openid || '';

      if (openid) {
        await api.wechat.subscribe(tmplId, remindType, openid);
        Taro.showToast({ title: '订阅成功，到期将自动提醒', icon: 'none' });
        loadSubscriptions();
      }
    } catch (err) {
      // 用户拒绝订阅或出错了
      if (err.errMsg?.includes('cancel') || err.errMsg?.includes('refuse')) {
        Taro.showToast({ title: '已取消订阅', icon: 'none' });
      } else {
        console.error('订阅失败:', err);
        Taro.showToast({ title: '订阅失败，请重试', icon: 'none' });
      }
    } finally {
      setSubscribing(false);
    }
  };

  // 切换开关
  const handleToggle = async (sub: any, enabled: boolean) => {
    try {
      await api.wechat.toggle(sub.id, enabled);
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, enabled: enabled ? 1 : 0 } : s));
    } catch (err) {
      console.error('切换失败:', err);
    }
  };

  const currentSub = subs.find(s => s.remind_type === 'todo_due');

  return (
    <ScrollView className='page-notifications' scrollY>
      <View className='section'>
        <Text className='section__title'>微信消息提醒</Text>
        <Text className='section__desc'>
          通过微信「服务通知」推送消息，即使不打开小程序也能收到提醒
        </Text>
      </View>

      {/* 待办到期提醒 */}
      <View className='notif-card'>
        <View className='notif-card__header'>
          <View className='notif-card__info'>
            <Text className='notif-card__name'>⏰ 待办到期提醒</Text>
            <Text className='notif-card__desc'>待办事项到期时，通过微信推送通知</Text>
          </View>
          {currentSub ? (
            <Switch
              checked={currentSub.enabled === 1}
              color='#6366f1'
              onChange={(e) => handleToggle(currentSub, e.detail.value)}
            />
          ) : (
            <Button
              className='notif-card__btn'
              loading={subscribing}
              onClick={() => handleSubscribe('todo_due')}
            >
              订阅
            </Button>
          )}
        </View>
        {currentSub && (
          <View className='notif-card__footer'>
            <Text className='notif-card__status'>
              {currentSub.enabled ? '✅ 已开启，到期将自动提醒' : '⏸ 已暂停'}
            </Text>
            {currentSub.last_sent_at && (
              <Text className='notif-card__sent'>
                上次推送: {currentSub.last_sent_at?.substring(0, 10)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 使用说明 */}
      <View className='section'>
        <Text className='section__title'>使用说明</Text>
        <Text className='section__tip'>
          ① 在笔记中为待办事项设置「截止日期」{'\n'}
          ② 点击「订阅」并允许微信发送通知{'\n'}
          ③ 到期时通过微信「服务通知」自动提醒你
        </Text>
      </View>

      <View style='height: 32px' />
    </ScrollView>
  );
}
