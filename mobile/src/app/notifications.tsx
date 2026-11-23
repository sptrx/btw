import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText, LoadingState, Notice } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { NotificationPrefs } from '@/lib/types';

const ROWS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'prayerUpdates', label: 'Prayer wall', hint: 'When someone prays or encourages your requests' },
  { key: 'comments', label: 'Comments', hint: 'Replies on your posts' },
  { key: 'follows', label: 'New followers', hint: 'When someone starts following you' },
  { key: 'reactions', label: 'Reactions', hint: 'Amen and other responses on your posts' },
  { key: 'wordOfGodReminder', label: 'Word of God', hint: 'Daily scripture practice reminder' },
  { key: 'channelUpdates', label: 'Channels you walk with', hint: 'New posts from favorite channels' },
];

export default function NotificationsScreen() {
  const theme = useTheme();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api<NotificationPrefs>('notifications.get')
      .then(setPrefs)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load alerts.'));
  }, []);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(key);
    try {
      const result = await api<{ success: true; prefs: NotificationPrefs }>('notifications.update', {
        [key]: value,
      });
      setPrefs(result.prefs);
      setError(null);
    } catch (e) {
      setPrefs(prefs);
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(null);
    }
  }

  if (!prefs && !error) return <LoadingState />;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <AppText tone="secondary">
        Choose which alerts you want. Push delivery will use these choices when notifications are enabled on
        your device.
      </AppText>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {prefs
        ? ROWS.map((row) => (
            <View key={row.key} style={[styles.row, { borderColor: theme.border }]}>
              <View style={styles.copy}>
                <AppText variant="label">{row.label}</AppText>
                <AppText variant="caption" tone="secondary">
                  {row.hint}
                </AppText>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={(v) => toggle(row.key, v)}
                disabled={saving === row.key}
                trackColor={{ true: theme.accent }}
              />
            </View>
          ))
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1, gap: 2 },
});
