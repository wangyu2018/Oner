import { View, Text, ScrollView, Image, Button, Canvas } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useShareAppMessage, useShareTimeline, useDidShow } from '@tarojs/taro';
import { api } from '../../api';
import './index.less';

export default function SharePage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [inviteCount, setInviteCount] = useState(0);

  useShareAppMessage(() => ({
    title: user
      ? `我在用 Oner 管理效率，快来一起体验！`
      : 'Oner - 你的效率工作台',
    path: user
      ? `/pages/index/index?inviter=${user.id}`
      : '/pages/index/index',
    imageUrl: '/assets/share-cover.svg',
  }));

  useShareTimeline(() => ({
    title: 'Oner - 你的效率工作台',
    imageUrl: '/assets/share-cover.svg',
  }));

  useEffect(() => {
    loadUser();
    loadQrCode();
  }, []);

  const loadUser = async () => {
    try {
      const { code } = await Taro.login();
      const res = await api.auth.miniLogin(code);
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
    }
  };

  const loadQrCode = async () => {
    setLoading(true);
    try {
      const res = await api.wechat.getQrCode();
      if (res?.data?.qrCodeUrl) {
        setQrCodeUrl(res.data.qrCodeUrl);
      }
    } catch (err) {
      console.error('获取小程序码失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareFriend = () => {
    // 触发微信转发（需在 button open-type="share" 中触发）
  };

  return (
    <ScrollView className='page-share' scrollY>
      {/* 头部 */}
      <View className='share-header'>
        <Text className='share-header__title'>邀请好友</Text>
        <Text className='share-header__desc'>
          分享 Oner 给朋友，一起提升效率
        </Text>
      </View>

      {/* 小程序码区域 */}
      <View className='qr-section'>
        <View className='qr-card'>
          {loading ? (
            <View className='qr-placeholder'>
              <Text className='qr-placeholder__text'>加载中...</Text>
            </View>
          ) : qrCodeUrl ? (
            <Image className='qr-image' src={qrCodeUrl} mode='aspectFit' />
          ) : (
            <View className='qr-placeholder'>
              <Text className='qr-placeholder__icon'>📱</Text>
              <Text className='qr-placeholder__text'>长按识别小程序码</Text>
            </View>
          )}
          <Text className='qr-card__name'>Oner 效率工作台</Text>
          <Text className='qr-card__desc'>笔记 · AI · 看板 · 密码库 · 备忘</Text>
        </View>
      </View>

      {/* 分享按钮 */}
      <View className='share-actions'>
        <Button
          className='share-btn share-btn--primary'
          openType='share'
        >
          <Text className='share-btn__icon'>💬</Text>
          <Text className='share-btn__text'>分享给好友</Text>
        </Button>

        <Button
          className='share-btn share-btn--secondary'
          openType='share'
          // @ts-ignore
          shareType='timeline'
        >
          <Text className='share-btn__icon'>🔄</Text>
          <Text className='share-btn__text'>分享到朋友圈</Text>
        </Button>
      </View>

      {/* 邀请说明 */}
      <View className='share-info'>
        <View className='info-card'>
          <Text className='info-card__title'>📌 邀请说明</Text>
          <View className='info-card__item'>
            <Text className='info-card__dot'>•</Text>
            <Text className='info-card__text'>好友通过你的分享进入小程序，将自动记录邀请关系</Text>
          </View>
          <View className='info-card__item'>
            <Text className='info-card__dot'>•</Text>
            <Text className='info-card__text'>邀请越多，未来可解锁更多高级功能</Text>
          </View>
          <View className='info-card__item'>
            <Text className='info-card__dot'>•</Text>
            <Text className='info-card__text'>好友也可以继续邀请其他人，形成裂变传播</Text>
          </View>
        </View>
      </View>

      {/* 下载 App 提示 */}
      <View className='app-hint'>
        <Text className='app-hint__text'>
          💡 完整版体验请下载 Oner App，支持更多功能
        </Text>
      </View>

      <View style='height: 32px' />
    </ScrollView>
  );
}
