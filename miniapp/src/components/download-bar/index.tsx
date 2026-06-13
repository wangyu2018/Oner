import { View, Text, Image } from '@tarojs/components';
import './index.less';

interface DownloadBarProps {
  text?: string;
}

export default function DownloadBar({ text = '打开 App 体验完整功能' }: DownloadBarProps) {
  return (
    <View className='download-bar'>
      <View className='download-bar__content'>
        <View className='download-bar__icon'>
          <Text className='download-bar__icon-text'>O</Text>
        </View>
        <View className='download-bar__info'>
          <Text className='download-bar__title'>Oner</Text>
          <Text className='download-bar__desc'>你的效率工作台</Text>
        </View>
        <View className='download-bar__btn'>
          <Text className='download-bar__btn-text'>下载 App</Text>
        </View>
      </View>
      <Text className='download-bar__hint'>{text}</Text>
    </View>
  );
}
