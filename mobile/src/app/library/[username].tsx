import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Notice,
  TextField,
} from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { config } from '@/lib/config';
import type { ShareableLibrary } from '@/lib/types';

type LoadState = {
  key: string;
  data: ShareableLibrary | null;
  error: string | null;
};

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { session } = useAuth();
  const [state, setState] = useState<LoadState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [notePublic, setNotePublic] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg, setNoteMsg] = useState<string | null>(null);

  const requestKey = String(username ?? '');

  useEffect(() => {
    if (!requestKey) return;
    let cancelled = false;
    api<ShareableLibrary>('library', { username: requestKey }).then(
      (data) => {
        if (!cancelled) setState({ key: requestKey, data, error: null });
      },
      (e) => {
        if (!cancelled) {
          setState({
            key: requestKey,
            data: null,
            error: e instanceof Error ? e.message : 'Could not open this library.',
          });
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  async function reload() {
    setRefreshing(true);
    try {
      const data = await api<ShareableLibrary>('library', { username: requestKey });
      setState({ key: requestKey, data, error: null });
    } catch (e) {
      setState({
        key: requestKey,
        data: state?.data ?? null,
        error: e instanceof Error ? e.message : 'Could not open this library.',
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function saveNote() {
    setSavingNote(true);
    setNoteMsg(null);
    try {
      await api('journal.save', { title: noteTitle, body: noteBody, isPublic: notePublic });
      setNoteTitle('');
      setNoteBody('');
      setNoteMsg('Note saved.');
      await reload();
    } catch (e) {
      setNoteMsg(e instanceof Error ? e.message : 'Could not save note.');
    } finally {
      setSavingNote(false);
    }
  }

  const ready = state?.key === requestKey;
  const data = ready ? state.data : null;
  const error = ready ? state.error : null;

  if (!data) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        {!ready || (!error && !data) ? (
          <LoadingState />
        ) : (
          <ErrorState message={error ?? 'Not found'} onRetry={reload} />
        )}
      </View>
    );
  }

  const shareUrl = `${config.siteUrl}/u/${data.owner.username || data.owner.id}`;
  const shareLibrary = () =>
    Share.share({
      message: `${data.libraryTitle} on Believe The Works\n${shareUrl}`,
    });

  return (
    <>
      <Stack.Screen options={{ title: data.libraryTitle }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.accent} />
        }>
        <AppText variant="title">{data.libraryTitle}</AppText>
        <AppText tone="secondary">
          Favorite content, channels they walk with, scriptures memorized, and notes.
        </AppText>
        <Button title="Share library" variant="secondary" small onPress={shareLibrary} style={styles.start} />

        <Section title="Scriptures memorized">
          {data.memorized.length === 0 ? (
            <AppText tone="secondary">No memorized verses yet.</AppText>
          ) : (
            data.memorized.map((m) => (
              <Card key={m.id}>
                <AppText variant="label" tone="primary">
                  {m.reference}
                </AppText>
                <AppText variant="small">{m.text}</AppText>
                <AppText variant="caption" tone="secondary">
                  Practiced {m.practiceCount}× · last {m.practicedOn}
                </AppText>
              </Card>
            ))
          )}
        </Section>

        <Section title="Favorite posts">
          {data.kept.length === 0 ? (
            <AppText tone="secondary">No kept posts yet.</AppText>
          ) : (
            data.kept.map((k) => (
              <Card
                key={k.contentId}
                onPress={() => router.push({ pathname: '/post/[id]', params: { id: k.contentId } })}>
                <AppText variant="caption" tone="secondary">
                  {k.typeLabel} · {k.channelTitle}
                </AppText>
                <AppText variant="heading">{k.title}</AppText>
                {k.bodySnippet ? (
                  <AppText variant="small" tone="secondary" numberOfLines={3}>
                    {k.bodySnippet}
                  </AppText>
                ) : null}
              </Card>
            ))
          )}
        </Section>

        <Section title="Favorite channels">
          {data.walkingWith.length === 0 ? (
            <AppText tone="secondary">Not walking with any channels yet.</AppText>
          ) : (
            data.walkingWith.map((c) => (
              <Card
                key={c.topicId}
                onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: c.slug } })}>
                <AppText variant="heading">{c.title}</AppText>
                {c.description ? (
                  <AppText variant="small" tone="secondary" numberOfLines={2}>
                    {c.description}
                  </AppText>
                ) : null}
              </Card>
            ))
          )}
        </Section>

        <Section title="Notes & journals">
          {data.notes.length === 0 ? (
            <AppText tone="secondary">No notes yet.</AppText>
          ) : (
            data.notes.map((n) => (
              <Card key={n.id}>
                <AppText variant="heading">{n.title}</AppText>
                <AppText variant="small">{n.body}</AppText>
                <AppText variant="caption" tone="secondary">
                  {n.isPublic ? 'Public' : 'Private'}
                </AppText>
              </Card>
            ))
          )}

          {data.isOwner && session ? (
            <View style={styles.noteForm}>
              <AppText variant="label">Add a note</AppText>
              <TextField label="Title" value={noteTitle} onChangeText={setNoteTitle} maxLength={200} />
              <TextField label="Journal" value={noteBody} onChangeText={setNoteBody} multiline maxLength={20000} />
              <Button
                title={notePublic ? 'Will be public' : 'Will be private'}
                variant="secondary"
                small
                onPress={() => setNotePublic((v) => !v)}
              />
              {noteMsg ? <Notice tone={noteMsg.includes('saved') ? 'success' : 'error'}>{noteMsg}</Notice> : null}
              <Button
                title="Save note"
                onPress={saveNote}
                loading={savingNote}
                disabled={!noteTitle.trim() || !noteBody.trim()}
              />
            </View>
          ) : null}
        </Section>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading">{title}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  start: { alignSelf: 'flex-start' },
  section: { gap: Spacing.two, marginTop: Spacing.two },
  noteForm: { gap: Spacing.three, marginTop: Spacing.two },
});
