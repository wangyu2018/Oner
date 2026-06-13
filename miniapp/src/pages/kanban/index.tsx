import { View, Text, ScrollView } from '@tarojs/components';
import DownloadBar from '../../components/download-bar';
import '../../pages/preview.less';

export default function KanbanPreview() {
  return (
    <ScrollView className='page-preview' scrollY>
      <View className='preview-header'>
        <Text className='preview-header__title'>看板视图</Text>
        <Text className='preview-header__count'>预览模式</Text>
      </View>

      <View className='kanban-board'>
        <View className='kanban-column'>
          <Text className='kanban-column__title kanban-column__title--todo'>待办</Text>
          <View className='kanban-card'>设计新版首页</View>
          <View className='kanban-card'>修复搜索bug</View>
        </View>
        <View className='kanban-column'>
          <Text className='kanban-column__title kanban-column__title--doing'>进行中</Text>
          <View className='kanban-card'>API接口开发</View>
        </View>
        <View className='kanban-column'>
          <Text className='kanban-column__title kanban-column__title--done'>完成</Text>
          <View className='kanban-card'>需求评审</View>
          <View className='kanban-card'>UI设计稿</View>
        </View>
      </View>

      <DownloadBar text='下载 App 使用拖拽看板管理任务' />
      <View style='height: 32px' />
    </ScrollView>
  );
}
