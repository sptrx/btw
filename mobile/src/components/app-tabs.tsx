import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      tintColor={theme.accent}
      iconColor={{ default: theme.textSecondary, selected: theme.accent }}
      labelStyle={{ default: { color: theme.textSecondary }, selected: { color: theme.accent } }}
      minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Feed</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="channels">
        <NativeTabs.Trigger.Label>Channels</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.stack', selected: 'square.stack.fill' }}
          md="video_library"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prayer">
        <NativeTabs.Trigger.Label>Prayer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'hands.sparkles', selected: 'hands.sparkles.fill' }} md="volunteer_activism" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ask">
        <NativeTabs.Trigger.Label>Ask</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} md="menu_book" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
