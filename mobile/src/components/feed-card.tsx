import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { ReactionBar } from '@/components/reaction-bar';
import { AppText, Badge, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
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

export function FeedCard({ item }: { item: FeedItem }) {
  const theme = useTheme();
  const router = useRouter();
  const open =
    item.postKind === 'topic_content'
      ? () => router.push({ pathname: '/post/[id]', params: { id: item.id } })
      : item.postKind === 'prayer_request'
        ? () => router.push({ pathname: '/prayer/[id]', params: { id: item.id } })
        : item.postKind === 'short' && item.playerUrl
          ? () => WebBrowser.openBrowserAsync(item.playerUrl as string)
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
      {item.postKind === 'short' && item.posterUrl ? (
        <View style={[styles.shortWrap, { backgroundColor: theme.muted }]}>
          <Image
            source={item.posterUrl}
            style={styles.shortPoster}
            contentFit="cover"
            accessibilityLabel="Short video thumbnail"
          />
          <View style={styles.playBadge}>
            <Icon ios="play.fill" md="play_arrow" size={22} color="#fff" />
          </View>
          {item.durationSeconds ? (
            <View style={styles.durationBadge}>
              <AppText variant="caption" style={styles.durationText}>
                {`${Math.round(item.durationSeconds)}s`}
              </AppText>
            </View>
          ) : null}
        </View>
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
  shortWrap: {
    width: '62%',
    aspectRatio: 9 / 16,
    maxHeight: 360,
    borderRadius: Radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortPoster: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  playBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.one,
    right: Spacing.one,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  durationText: { color: '#fff' },
  title: { marginTop: 2 },
});
