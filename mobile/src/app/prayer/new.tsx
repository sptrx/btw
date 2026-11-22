import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ContentDisclaimer } from '@/components/disclaimer';
import { AppText, Button, Checkbox, Notice, TextField } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type CreateResult = { success: true; id?: string; pendingReview?: boolean; message?: string };

export default function NewPrayerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { me, refreshMe } = useAuth();
  const accepted = Boolean(me?.disclaimerAccepted);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const result = await api<CreateResult>('prayer.create', {
        title,
        body,
        isAnonymous: anonymous,
        acceptedDisclaimer: agreed,
      });
      if (!accepted) refreshMe();
      if (result.id) {
        router.replace({ pathname: '/prayer/[id]', params: { id: result.id } });
      } else {
        setPendingMessage(result.message ?? 'Thanks for sharing. Your request is in our review queue.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not share your request.');
    } finally {
      setSending(false);
    }
  }

  if (pendingMessage) {
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
        <Notice tone="success">{pendingMessage}</Notice>
        <Button title="Done" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled">
      <AppText tone="secondary">
        Share what you would like the community to pray for. Requests are reviewed to keep the wall safe and
        encouraging.
      </AppText>
      <TextField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Healing for my mother"
        maxLength={200}
      />
      <TextField
        label="Your request"
        value={body}
        onChangeText={setBody}
        placeholder="Share as much as you're comfortable with"
        multiline
        maxLength={5000}
      />
      <Checkbox checked={anonymous} onChange={setAnonymous}>
        <AppText variant="small">Post anonymously (shown as “A sister/brother in Christ”)</AppText>
      </Checkbox>
      <ContentDisclaimer accepted={accepted} checked={agreed} onChange={setAgreed} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button
        title="Share prayer request"
        onPress={submit}
        loading={sending}
        disabled={!title.trim() || !body.trim() || (!accepted && !agreed)}
      />
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
