import { View, Text, ScrollView } from '@tarojs/components';
import DownloadBar from '../../components/download-bar';
import '../../pages/preview.less';

export default function AiPreview() {
  return (
    <ScrollView className='page-preview' scrollY>
      <View className='preview-header'>
        <Text className='preview-header__title'>AI 智能助手</Text>
        <Text className='preview-header__count'>预览模式</Text>
      </View>

      <View className='ai-chat'>
        <View className='ai-chat__bubble'>
          <View className='ai-chat__avatar ai-chat__avatar--ai'>🤖</View>
          <View className='ai-chat__text ai-chat__text--ai'>
            你好！我是你的 AI 助手，可以帮你分析笔记、总结内容、拆解任务。
          </View>
        </View>
        <View className='ai-chat__bubble ai-chat__bubble--user'>
          <View className='ai-chat__avatar ai-chat__avatar--user'>👤</View>
          <View className='ai-chat__text ai-chat__text--user'>
            帮我总结今天的待办事项
          </View>
        </View>
        <View className='ai-chat__bubble'>
          <View className='ai-chat__avatar ai-chat__avatar--ai'>🤖</View>
          <View className='ai-chat__text ai-chat__text--ai'>
            好的，我来看看你今天有哪些任务需要处理...
          </View>
        </View>
      </View>

      <DownloadBar text='下载 App 使用 AI 对话、内容润色、智能分析' />
      <View style='height: 32px' />
    </ScrollView>
  );
}
