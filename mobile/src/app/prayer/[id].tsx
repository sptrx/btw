import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';

import { PrayButton } from '@/components/pray-button';
import {
  AppText,
  Badge,
  Button,
  Divider,
  ErrorState,
  LoadingState,
  Notice,
  TextField,
} from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { config } from '@/lib/config';
import { timeAgo } from '@/lib/format';
import type { PrayerComment, PrayerRequest, SubmitResult } from '@/lib/types';

type NoticeState = { tone: 'success' | 'error'; text: string } | null;

export default function PrayerDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, refreshing, reload } = useApi<{
    request: PrayerRequest;
    comments: PrayerComment[];
  }>('prayer', { id });

  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [commentNotice, setCommentNotice] = useState<NoticeState>(null);
  const [praise, setPraise] = useState('');
  const [answering, setAnswering] = useState(false);
  const [sendingPraise, setSendingPraise] = useState(false);
  const [praiseNotice, setPraiseNotice] = useState<NoticeState>(null);

  if (!data) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        {loading ? (
          <LoadingState />
        ) : (
          <ErrorState message={error ?? 'Prayer request not found.'} onRetry={reload} />
        )}
      </View>
    );
  }

  const { request, comments } = data;

  async function sendComment() {
    setSendingComment(true);
    setCommentNotice(null);
    try {
      await api('prayer.comment', { id, body: comment });
      setComment('');
      setCommentNotice({ tone: 'success', text: 'Encouragement sent.' });
      reload();
    } catch (e) {
      setCommentNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Could not send.' });
    } finally {
      setSendingComment(false);
    }
  }

  async function markAnswered() {
    setSendingPraise(true);
    setPraiseNotice(null);
    try {
      const result = await api<SubmitResult>('prayer.answered', { id, body: praise });
      setPraise('');
      setAnswering(false);
      setPraiseNotice({
        tone: 'success',
        text: result.pendingReview && result.message ? result.message : 'Praise God! Your praise report is shared.',
      });
      reload();
    } catch (e) {
      setPraiseNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Could not save.' });
    } finally {
      setSendingPraise(false);
    }
  }

  const share = () =>
    Share.share({ message: `Please pray: ${request.title}\n${config.siteUrl}/prayer/${request.id}` });

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.accent} />}>
      {request.status === 'answered' ? <Badge label="Answered" /> : null}
      <AppText variant="title" accessibilityRole="header">
        {request.title}
      </AppText>
      <AppText variant="small" tone="secondary">
        {[request.authorDisplayName ?? 'Community member', timeAgo(request.createdAt)]
          .filter(Boolean)
          .join(' · ')}
      </AppText>
      <AppText selectable style={styles.body}>
        {request.body}
      </AppText>

      <View style={styles.row}>
        <PrayButton
          key={`${request.userIsPraying}:${request.prayerCount}`}
          requestId={request.id}
          praying={request.userIsPraying}
          count={request.prayerCount}
        />
        <Button title="Share" variant="secondary" small onPress={share} />
      </View>

      {request.isOwner && request.status === 'active' ? (
        answering ? (
          <View style={styles.form}>
            <TextField
              label="How did God answer?"
              value={praise}
              onChangeText={setPraise}
              placeholder="Share your praise report"
              multiline
              maxLength={5000}
            />
            <View style={styles.row}>
              <Button
                title="Share praise report"
                onPress={markAnswered}
                loading={sendingPraise}
                disabled={!praise.trim()}
              />
              <Button title="Cancel" variant="ghost" onPress={() => setAnswering(false)} />
            </View>
          </View>
        ) : (
          <Button title="Mark as answered" variant="secondary" onPress={() => setAnswering(true)} />
        )
      ) : null}
      {praiseNotice ? <Notice tone={praiseNotice.tone}>{praiseNotice.text}</Notice> : null}

      <Divider />
      <AppText variant="heading">Encouragement</AppText>
      {comments.length === 0 ? (
        <AppText tone="secondary">Be the first to leave a word of encouragement.</AppText>
      ) : null}
      {comments.map((c) => (
        <View key={c.id} style={[styles.comment, { borderBottomColor: theme.border }]}>
          <AppText variant="label">{c.authorDisplayName ?? 'Member'}</AppText>
          <AppText selectable>{c.body}</AppText>
          <AppText variant="caption" tone="secondary">
            {timeAgo(c.createdAt)}
          </AppText>
        </View>
      ))}

      {session ? (
        <View style={styles.form}>
          <TextField
            label="Leave encouragement"
            value={comment}
            onChangeText={setComment}
            placeholder="Praying for you…"
            multiline
            maxLength={2000}
          />
          {commentNotice ? <Notice tone={commentNotice.tone}>{commentNotice.text}</Notice> : null}
          <Button title="Send" onPress={sendComment} loading={sendingComment} disabled={!comment.trim()} />
        </View>
      ) : (
        <Button title="Sign in to encourage" variant="secondary" onPress={() => router.push('/sign-in')} />
      )}
    </ScrollView>
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
  body: { fontSize: 17, lineHeight: 27 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  form: { gap: Spacing.three, marginTop: Spacing.two },
  comment: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
