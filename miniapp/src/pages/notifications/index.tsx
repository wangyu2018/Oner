import { View, Text, ScrollView, Switch, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { api } from '../../api';
import './index.less';

// 微信订阅消息模板配置
// 模板 ID 需在微信小程序后台「公共模板库」中申请获取
interface TemplateConfig {
  id: string;
  name: string;
  icon: string;
  desc: string;
  envKey: string; // 环境变量 key
  steps: string;
}

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  todo_due: {
    id: '',
    name: '待办到期提醒',
    icon: '⏰',
    desc: '待办事项到期时，通过微信推送通知',
    envKey: 'TARO_APP_WX_TMPL_TODO_DUE',
    steps: '在笔记中为待办事项设置「截止日期」，到期自动提醒',
  },
  memo_done: {
    id: '',
    name: '备忘完成回执',
    icon: '✅',
    desc: '当备忘标记为已完成时，推送确认通知',
    envKey: 'TARO_APP_WX_TMPL_MEMO_DONE',
    steps: '完成备忘后自动发送回执，确认任务已完成',
  },
  daily_summary: {
    id: '',
    name: '每日效率汇总',
    icon: '📊',
    desc: '每天早上 9:00 推送今日效率报告',
    envKey: 'TARO_APP_WX_TMPL_DAILY_SUMMARY',
    steps: '每天推送新建笔记数、待办数、完成数等统计',
  },
};

export default function NotificationsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

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

  // 获取模板 ID：优先环境变量，其次本地配置
  const getTemplateId = (remindType: string): string => {
    const config = TEMPLATE_CONFIGS[remindType];
    if (!config) return '';

    // 尝试从环境变量获取
    const envValue = process.env[config.envKey];
    if (envValue) return envValue;

    return config.id;
  };

  // 请求订阅
  const handleSubscribe = async (remindType: string) => {
    const tmplId = getTemplateId(remindType);
    if (!tmplId) {
      Taro.showToast({ title: '模板未配置，请联系管理员', icon: 'none' });
      return;
    }

    setSubscribing(remindType);
    try {
      // 微信订阅消息 API
      const { errmsg } = await Taro.requestSubscribeMessage({
        tmplIds: [tmplId],
      });

      // 用户同意订阅后保存到后端
      const { code } = await Taro.login();
      const loginRes: any = await api.auth.miniLogin(code);
      const openid = loginRes?.data?.openid || '';

      if (openid) {
        await api.wechat.subscribe(tmplId, remindType, openid);
        Taro.showToast({ title: '订阅成功', icon: 'success' });
        loadSubscriptions();
      }
    } catch (err: any) {
      // 用户拒绝订阅或出错了
      if (err?.errMsg?.includes('cancel') || err?.errMsg?.includes('refuse')) {
        Taro.showToast({ title: '已取消订阅', icon: 'none' });
      } else {
        console.error('订阅失败:', err);
        Taro.showToast({ title: '订阅失败，请重试', icon: 'none' });
      }
    } finally {
      setSubscribing(null);
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

  // 渲染单个订阅卡片
  const renderSubCard = (type: string) => {
    const config = TEMPLATE_CONFIGS[type];
    const currentSub = subs.find(s => s.remind_type === type);

    return (
      <View className='notif-card' key={type}>
        <View className='notif-card__header'>
          <View className='notif-card__info'>
            <Text className='notif-card__name'>{config.icon} {config.name}</Text>
            <Text className='notif-card__desc'>{config.desc}</Text>
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
              loading={subscribing === type}
              onClick={() => handleSubscribe(type)}
            >
              订阅
            </Button>
          )}
        </View>
        {currentSub && (
          <View className='notif-card__footer'>
            <Text className='notif-card__status'>
              {currentSub.enabled ? '✅ 已开启' : '⏸ 已暂停'}
            </Text>
            {currentSub.last_sent_at && (
              <Text className='notif-card__sent'>
                上次推送: {currentSub.last_sent_at?.substring(0, 10)}
              </Text>
            )}
          </View>
        )}
        {!currentSub && (
          <View className='notif-card__footer'>
            <Text className='notif-card__tip'>💡 {config.steps}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView className='page-notifications' scrollY>
      <View className='section'>
        <Text className='section__title'>微信消息提醒</Text>
        <Text className='section__desc'>
          通过微信「服务通知」推送消息，即使不打开小程序也能收到提醒
        </Text>
      </View>

      {loading ? (
        <View className='loading'>加载中...</View>
      ) : (
        <>
          {/* 三种订阅类型 */}
          {renderSubCard('todo_due')}
          {renderSubCard('memo_done')}
          {renderSubCard('daily_summary')}
        </>
      )}

      {/* 使用说明 */}
      <View className='section'>
        <Text className='section__title'>使用说明</Text>
        <View className='section__tips'>
          <Text className='section__tip'>
            ① 点击「订阅」并允许微信发送通知{'\n'}
            ② 微信订阅消息每次授权只能发送一次{'\n'}
            ③ 如需持续接收通知，请在每次操作后重新授权{'\n'}
            ④ 可在微信「服务通知」中查看推送的消息
          </Text>
        </View>
      </View>

      <View style='height: 32px' />
    </ScrollView>
  );
}
