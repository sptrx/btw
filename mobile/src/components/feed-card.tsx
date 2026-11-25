import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ReactionBar } from '@/components/reaction-bar';
import { ShortVideo } from '@/components/short-video';
import { AppText, Badge } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { config } from '@/lib/config';
import { plural, timeAgo } from '@/lib/format';
import type { FeedItem } from '@/lib/types';

function shareUrlFor(item: FeedItem): string {
  if (item.postKind === 'topic_content') {
    const slug = item.channelSlug ?? 'browse';
    return `${config.siteUrl}/channel/${slug}/content/${item.id}`;
  }
  if (item.postKind === 'prayer_request') {
    return `${config.siteUrl}/prayer/${item.id}`;
  }
  if (item.postKind === 'short') {
    return `${config.siteUrl}/shorts/${item.id}`;
  }
  return `${config.siteUrl}/prayer`;
}

export function FeedCard({ item, shortActive = false }: { item: FeedItem; shortActive?: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const open =
    item.postKind === 'topic_content'
      ? () => router.push({ pathname: '/post/[id]', params: { id: item.id } })
      : item.postKind === 'prayer_request'
        ? () => router.push({ pathname: '/prayer/[id]', params: { id: item.id } })
        : undefined;

  const byline = [item.authorLabel, item.channelTitle].filter(Boolean).join(' · ');
  const meta = [
    timeAgo(item.createdAt),
    item.readMinutes && item.readMinutes > 1 ? `${item.readMinutes} min read` : null,
    item.commentCount ? plural(item.commentCount, 'comment') : null,
  ].filter(Boolean);

  const body = (
    <>
      <View style={styles.top}>
        <Badge label={item.badge} />
        <View style={styles.topRight}>
          {item.fromFollowed ? (
            <AppText variant="caption" tone="primary">
              Following
            </AppText>
          ) : null}
          {meta[0] ? (
            <AppText variant="caption" tone="secondary">
              {meta[0]}
            </AppText>
          ) : null}
        </View>
      </View>
      <AppText variant="heading" numberOfLines={3} style={styles.title}>
        {item.title}
      </AppText>
      {item.postKind === 'short' ? (
        <ShortVideo
          hlsUrl={item.hlsUrl ?? null}
          posterUrl={item.posterUrl ?? null}
          durationSeconds={item.durationSeconds}
          active={shortActive}
        />
      ) : null}
      {item.scriptureReference ? (
        <AppText variant="small" tone="primary">
          {item.scriptureReference}
        </AppText>
      ) : null}
      {item.bodySnippet && item.bodySnippet !== item.title ? (
        <AppText variant="small" tone="secondary" numberOfLines={3}>
          {item.bodySnippet}
        </AppText>
      ) : null}
      {byline || meta.length > 1 ? (
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {[byline, ...meta.slice(1)].filter(Boolean).join(' · ')}
        </AppText>
      ) : null}
      <ReactionBar
        key={JSON.stringify([item.reactions, item.userReaction])}
        postId={item.id}
        postKind={item.postKind}
        counts={item.reactions}
        userReaction={item.userReaction}
        shareUrl={shareUrlFor(item)}
        shareTitle={item.title}
      />
    </>
  );

  if (!open) {
    return <View style={[styles.row, { borderBottomColor: theme.border }]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${item.badge}: ${item.title}`}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border, opacity: pressed ? 0.88 : 1 },
      ]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { marginTop: 2 },
});
