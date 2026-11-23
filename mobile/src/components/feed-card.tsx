import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ReactionBar } from '@/components/reaction-bar';
import { AppText, Badge, Card } from '@/components/ui';
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
  return `${config.siteUrl}/prayer`;
}

export function FeedCard({ item }: { item: FeedItem }) {
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

  return (
    <Card onPress={open} accessibilityLabel={`${item.badge}: ${item.title}`}>
      <View style={styles.top}>
        <Badge label={item.badge} />
        {item.fromFollowed ? (
          <AppText variant="caption" tone="primary">
            Following
          </AppText>
        ) : null}
      </View>
      <AppText variant="heading" numberOfLines={3}>
        {item.title}
      </AppText>
      {item.scriptureReference ? (
        <AppText variant="small" tone="primary">
          {item.scriptureReference}
        </AppText>
      ) : null}
      {item.bodySnippet && item.bodySnippet !== item.title ? (
        <AppText variant="small" tone="secondary" numberOfLines={4}>
          {item.bodySnippet}
        </AppText>
      ) : null}
      {byline ? (
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {byline}
        </AppText>
      ) : null}
      <AppText variant="caption" tone="secondary">
        {meta.join(' · ')}
      </AppText>
      <ReactionBar
        key={JSON.stringify([item.reactions, item.userReaction])}
        postId={item.id}
        postKind={item.postKind}
        counts={item.reactions}
        userReaction={item.userReaction}
        shareUrl={shareUrlFor(item)}
        shareTitle={item.title}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
