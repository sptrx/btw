import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button, Icon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function PrayButton({
  requestId,
  praying,
  count,
}: {
  requestId: string;
  praying: boolean;
  count: number;
}) {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [state, setState] = useState({ praying, count });

  async function toggle() {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    const previous = state;
    setState({ praying: !previous.praying, count: previous.count + (previous.praying ? -1 : 1) });
    if (!previous.praying) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await api('prayer.toggle', { id: requestId });
    } catch (e) {
      setState(previous);
      Alert.alert('Could not update', e instanceof Error ? e.message : undefined);
    }
  }

  const label = state.praying ? 'Praying' : 'I prayed';
  return (
    <Button
      small
      variant={state.praying ? 'primary' : 'secondary'}
      title={state.count > 0 ? `${label} · ${state.count}` : label}
      icon={
        <Icon
          ios={state.praying ? 'hands.sparkles.fill' : 'hands.sparkles'}
          md="volunteer_activism"
          size={16}
          color={state.praying ? theme.onPrimary : theme.accent}
        />
      }
      onPress={toggle}
    />
  );
}
