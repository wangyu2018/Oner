import { View, Text, ScrollView } from '@tarojs/components';
import DownloadBar from '../../components/download-bar';
import '../../pages/preview.less';

const MEMOS = [
  { day: '今天', text: '记得提交季度周报', time: '09:30' },
  { day: '昨天', text: '整理项目需求文档，补充API接口说明', time: '14:20' },
  { day: '周二', text: '设置下季度OKR目标', time: '11:00' },
  { day: '周一', text: '修复线上bug：密码库搜索失效', time: '16:45' },
];

export default function MemosPreview() {
  return (
    <ScrollView className='page-preview' scrollY>
      <View className='preview-header'>
        <Text className='preview-header__title'>备忘时间线</Text>
        <Text className='preview-header__count'>预览模式</Text>
      </View>

      <View className='memo-timeline'>
        {MEMOS.map((memo, i) => (
          <View key={i} className='memo-item'>
            <View style='display: flex; flex-direction: column; align-items: center'>
              <View className='memo-item__dot' />
              {i < MEMOS.length - 1 && <View className='memo-item__line' />}
            </View>
            <View className='memo-item__content'>
              <Text className='memo-item__day'>{memo.day} {memo.time}</Text>
              <Text className='memo-item__text'>{memo.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <DownloadBar text='下载 App 快速记录备忘、管理时间线' />
      <View style='height: 32px' />
    </ScrollView>
  );
}
