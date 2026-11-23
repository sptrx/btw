import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Notice, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Today = {
  reference: string;
  text: string;
  practicedToday: boolean;
  practiceCount: number;
  bankSize: number;
};

type Result = { data: Today | null; error: string | null; key: string };

export function WordOfGodPanel() {
  const theme = useTheme();
  const router = useRouter();
  const { session, me } = useAuth();
  const requestKey = session?.user.id ?? 'anon';
  const [result, setResult] = useState<Result | null>(null);
  const [phase, setPhase] = useState<'read' | 'recall'>('read');
  const [attempt, setAttempt] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Today>('wordOfGod.today').then(
      (data) => {
        if (!cancelled) setResult({ data, error: null, key: requestKey });
      },
      (e) => {
        if (!cancelled) {
          setResult({
            data: null,
            error: e instanceof Error ? e.message : "Could not load today's verse.",
            key: requestKey,
          });
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const today = result?.key === requestKey ? result.data : null;
  const error = result?.key === requestKey ? result.error : null;

  async function practice() {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await api<{ success: true } | { error: string }>('wordOfGod.practice', {
        attempt,
      });
      if ('error' in res && res.error) {
        setNotice(res.error);
      } else {
        setNotice('Saved to your library. Keep hiding the Word in your heart.');
        setAttempt('');
        setPhase('read');
        const data = await api<Today>('wordOfGod.today');
        setResult({ data, error: null, key: requestKey });
        const key = me?.profile?.username || me?.user?.id;
        if (key) {
          Alert.alert('Practiced!', 'Added to your library.', [
            { text: 'Stay here', style: 'cancel' },
            { text: 'Open library', onPress: () => router.push(`/library/${key}` as never) },
          ]);
        }
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not save practice.');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <View style={styles.wrap}>
        <Notice tone="error">{error}</Notice>
      </View>
    );
  }

  if (!today) {
    return (
      <View style={styles.wrap}>
        <AppText tone="secondary">Loading today&apos;s Word…</AppText>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="title">Word of God</AppText>
      <AppText tone="secondary">
        One scripture to memorize today. Practice from memory, then it is kept in your library.
      </AppText>

      <Card>
        <AppText variant="label" tone="primary">
          {today.reference}
        </AppText>
        {phase === 'read' ? (
          <AppText selectable style={styles.verse}>
            {today.text}
          </AppText>
        ) : (
          <View style={[styles.hidden, { backgroundColor: theme.muted, borderColor: theme.border }]}>
            <AppText tone="secondary" style={styles.center}>
              Verse hidden — write it from memory
            </AppText>
          </View>
        )}
        <AppText variant="caption" tone="secondary">
          {today.practicedToday
            ? `Practiced today · ${today.practiceCount} total`
            : `${today.bankSize} verses in the practice bank`}
        </AppText>
      </Card>

      {phase === 'read' ? (
        <Button
          title="I've read it — practice from memory"
          onPress={() => {
            setPhase('recall');
            setAttempt('');
            setNotice(null);
          }}
        />
      ) : (
        <View style={styles.form}>
          <TextField
            label="Type the verse from memory"
            value={attempt}
            onChangeText={setAttempt}
            multiline
            placeholder="Begin writing…"
          />
          {notice ? <Notice tone={notice.startsWith('Saved') ? 'success' : 'error'}>{notice}</Notice> : null}
          <Button title="Check & save to library" onPress={practice} loading={busy} disabled={!attempt.trim()} />
          <Button title="Show verse again" variant="ghost" onPress={() => setPhase('read')} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: Spacing.three, gap: Spacing.three },
  verse: { fontSize: 18, lineHeight: 28 },
  hidden: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  center: { textAlign: 'center' },
  form: { gap: Spacing.three },
});
