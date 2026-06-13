import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import DownloadBar from '../../components/download-bar';
import { api } from '../../api';
import '../../pages/preview.less';

export default function NotesPreview() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notes.list({ limit: 20 }).then((res) => {
      const list = res?.data?.notes || res?.data || [];
      setNotes(list);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView className='page-preview' scrollY>
      {loading ? (
        <View className='loading'><Text>加载中...</Text></View>
      ) : (
        <>
          <View className='preview-header'>
            <Text className='preview-header__title'>最近笔记</Text>
            <Text className='preview-header__count'>共 {notes.length} 条</Text>
          </View>
          {notes.slice(0, 10).map((note) => (
            <View key={note.id} className='note-card'>
              <Text className='note-card__title'>{note.title || '无标题'}</Text>
              <Text className='note-card__excerpt'>
                {(note.content || '').substring(0, 80)}
              </Text>
              <View className='note-card__meta'>
                <Text className='note-card__status'>{note.status || 'note'}</Text>
                <Text className='note-card__date'>
                  {note.created_at ? note.created_at.substring(0, 10) : ''}
                </Text>
              </View>
            </View>
          ))}
          <DownloadBar text='下载 App 创建、编辑、管理全部笔记' />
          <View style='height: 32px' />
        </>
      )}
    </ScrollView>
  );
}
