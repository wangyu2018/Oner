import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import DownloadBar from '../../components/download-bar';
import { api } from '../../api';
import '../../pages/preview.less';

export default function PasswordsPreview() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.passwords.list({ limit: 10 }).then((res) => {
      const list = res?.data?.entries || res?.data?.passwords || res?.data || [];
      setItems(list);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView className='page-preview' scrollY>
      {loading ? (
        <View className='loading'><Text>加载中...</Text></View>
      ) : (
        <>
          <View className='preview-header'>
            <Text className='preview-header__title'>密码保险库</Text>
            <Text className='preview-header__count'>
              {items.length > 0 ? `${items.length} 条记录` : '无数据'}
            </Text>
          </View>
          {items.length === 0 ? (
            <>
              {[{ site: 'github.com', username: 'user1' }, { site: 'google.com', username: 'user2' }].map((item) => (
                <View key={item.site} className='password-item'>
                  <View className='password-item__icon'>🔐</View>
                  <View className='password-item__info'>
                    <Text className='password-item__site'>{item.site}</Text>
                    <Text className='password-item__username'>{item.username} · ********</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            items.slice(0, 10).map((item) => (
              <View key={item.id} className='password-item'>
                <View className='password-item__icon'>🔐</View>
                <View className='password-item__info'>
                  <Text className='password-item__site'>{item.site || item.name || '未命名'}</Text>
                  <Text className='password-item__username'>{item.username || '未知'} · ********</Text>
                </View>
              </View>
            ))
          )}
          <DownloadBar text='下载 App 管理密码、自动填充、PIN 保护' />
          <View style='height: 32px' />
        </>
      )}
    </ScrollView>
  );
}
