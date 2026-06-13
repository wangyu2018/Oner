import { View, Text } from '@tarojs/components';
import './index.less';

interface PluginCardProps {
  icon: string;
  name: string;
  desc: string;
  features: string[];
  path: string;
}

export default function PluginCard({ icon, name, desc, features, path }: PluginCardProps) {
  const handleClick = () => {
    Taro.navigateTo({ url: path });
  };

  return (
    <View className='plugin-card' onClick={handleClick}>
      <View className='plugin-card__header'>
        <Text className='plugin-card__icon'>{icon}</Text>
        <View className='plugin-card__header-info'>
          <Text className='plugin-card__name'>{name}</Text>
          <Text className='plugin-card__desc'>{desc}</Text>
        </View>
        <Text className='plugin-card__arrow'>›</Text>
      </View>
      <View className='plugin-card__features'>
        {features.map((f) => (
          <Text key={f} className='plugin-card__tag'>{f}</Text>
        ))}
      </View>
    </View>
  );
}
