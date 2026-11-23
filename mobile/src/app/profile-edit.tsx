import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText, Button, Checkbox, Notice, TextField } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { me, refreshMe } = useAuth();
  const p = me?.profile;

  const [form, setForm] = useState({
    displayName: p?.display_name ?? '',
    username: p?.username ?? '',
    bio: p?.bio ?? '',
    ministryName: p?.ministry_name ?? '',
    websiteUrl: p?.website_url ?? '',
    profilePrivate: Boolean(p?.profile_private),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K) => (value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api('profile.update', form);
      await refreshMe();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <TextField label="Display name" value={form.displayName} onChangeText={set('displayName')} maxLength={80} />
      <TextField
        label="Username"
        value={form.username}
        onChangeText={set('username')}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        hint="3–30 letters, numbers, underscores or hyphens"
      />
      <TextField label="Bio" value={form.bio} onChangeText={set('bio')} multiline maxLength={500} />
      <TextField label="Ministry or church" value={form.ministryName} onChangeText={set('ministryName')} maxLength={120} />
      <TextField
        label="Website or social link"
        value={form.websiteUrl}
        onChangeText={set('websiteUrl')}
        autoCapitalize="none"
        keyboardType="url"
      />
      <Checkbox checked={form.profilePrivate} onChange={set('profilePrivate')}>
        <AppText variant="small">Private profile (hide my details from other members)</AppText>
      </Checkbox>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button title="Save" onPress={save} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
