import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';

import { ContentDisclaimer } from '@/components/disclaimer';
import { MediaList } from '@/components/media-list';
import { ReactionBar } from '@/components/reaction-bar';
import {
  AppText,
  Badge,
  Button,
  Card,
  Checkbox,
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
import type { PostDetail, SubmitResult } from '@/lib/types';

export default function PostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, refreshing, reload } = useApi<PostDetail>('content', { id });

  const [body, setBody] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [askGuide, setAskGuide] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  if (!data) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        {loading ? <LoadingState /> : <ErrorState message={error ?? 'Post not found.'} onRetry={reload} />}
      </View>
    );
  }

  const { post, comments } = data;

  async function submit() {
    setSending(true);
    setNotice(null);
    try {
      const result = await api<SubmitResult>('content.comment', {
        id,
        body,
        acceptedDisclaimer: agreed,
        requestScriptureGuide: askGuide,
      });
      setBody('');
      setAskGuide(false);
      setNotice(
        result.guideError
          ? { tone: 'error', text: `Comment posted. ${result.guideError}` }
          : { tone: 'success', text: 'Comment posted.' }
      );
      reload();
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Could not post your comment.' });
    } finally {
      setSending(false);
    }
  }

  const share = () =>
    Share.share({
      message: `${post.title}\n${config.siteUrl}/channel/${post.channelSlug ?? 'browse'}/content/${post.id}`,
    });

  return (
    <>
      <Stack.Screen options={{ title: post.channelTitle ?? '' }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.accent} />}>
        {post.moderationStatus !== 'approved' ? (
          <Notice tone="info">
            {post.moderationStatus === 'rejected'
              ? 'This post was not approved and is only visible to you.'
              : 'This post is waiting for review and is only visible to you.'}
          </Notice>
        ) : null}

        {post.sharingType ? <Badge label={post.sharingType.replace(/_/g, ' ')} /> : null}
        <AppText variant="title" accessibilityRole="header">
          {post.title}
        </AppText>
        <AppText variant="small" tone="secondary">
          {[post.authorName, timeAgo(post.createdAt)].filter(Boolean).join(' · ')}
        </AppText>
        {post.channelSlug ? (
          <AppText
            variant="small"
            tone="primary"
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: post.channelSlug! } })}>
            {post.channelTitle}
          </AppText>
        ) : null}
        {post.scriptureReference ? (
          <AppText variant="label" tone="primary">
            {post.scriptureReference}
          </AppText>
        ) : null}

        <MediaList items={post.media} />
        {post.body ? (
          <AppText selectable style={styles.body}>
            {post.body}
          </AppText>
        ) : null}

        <ReactionBar
          key={JSON.stringify([data.reactions, data.userReaction])}
          postId={post.id}
          postKind="topic_content"
          counts={data.reactions}
          userReaction={data.userReaction}
        />
        <View style={styles.rowActions}>
          <Button title="Share" variant="secondary" small onPress={share} />
          {session && post.channelSlug ? (
            <Button
              title="Keep in library"
              variant="secondary"
              small
              onPress={async () => {
                try {
                  await api('library.keep', {
                    contentId: post.id,
                    channelSlug: post.channelSlug,
                    keep: true,
                  });
                  setNotice({ tone: 'success', text: 'Saved to your library.' });
                } catch (e) {
                  setNotice({
                    tone: 'error',
                    text: e instanceof Error ? e.message : 'Could not save.',
                  });
                }
              }}
            />
          ) : null}
        </View>

        <Divider />
        <AppText variant="heading">
          {comments.length ? `Comments (${comments.length})` : 'Comments'}
        </AppText>

        {comments.map((c) => (
          <Card key={c.id}>
            <AppText variant="label">{c.authorName ?? 'Member'}</AppText>
            <AppText selectable>{c.body}</AppText>
            <AppText variant="caption" tone="secondary">
              {timeAgo(c.createdAt)}
            </AppText>
            {c.scriptureGuideReply ? (
              <View style={[styles.guide, { borderColor: theme.accent }]}>
                <AppText variant="caption" tone="primary">
                  Scripture guide
                </AppText>
                <AppText variant="small" selectable>
                  {c.scriptureGuideReply}
                </AppText>
              </View>
            ) : null}
          </Card>
        ))}

        {session ? (
          <View style={styles.composer}>
            <TextField
              label="Add a comment"
              value={body}
              onChangeText={setBody}
              placeholder="Share encouragement or a reflection"
              multiline
              maxLength={5000}
            />
            <Checkbox checked={askGuide} onChange={setAskGuide}>
              <AppText variant="small">Ask the Scripture guide to reply with related verses</AppText>
            </Checkbox>
            <ContentDisclaimer compact accepted={data.disclaimerAccepted} checked={agreed} onChange={setAgreed} />
            {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
            <Button
              title="Post comment"
              onPress={submit}
              loading={sending}
              disabled={!body.trim() || (!data.disclaimerAccepted && !agreed)}
            />
          </View>
        ) : (
          <Button title="Sign in to comment" variant="secondary" onPress={() => router.push('/sign-in')} />
        )}
      </ScrollView>
    </>
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
  start: { alignSelf: 'flex-start' },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  guide: { borderLeftWidth: 3, paddingLeft: Spacing.two, gap: Spacing.one, marginTop: Spacing.one },
  composer: { gap: Spacing.three },
});
