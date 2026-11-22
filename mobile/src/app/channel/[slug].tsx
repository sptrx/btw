import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, Chip, EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { config } from '@/lib/config';
import { timeAgo } from '@/lib/format';
import type { ChannelDetail } from '@/lib/types';

export default function ChannelScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [pageSlug, setPageSlug] = useState('home');
  const { data, error, loading, refreshing, reload } = useApi<ChannelDetail>('channel', { slug, pageSlug });

  if (!data) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        {loading ? <LoadingState /> : <ErrorState message={error ?? 'Channel not found.'} onRetry={reload} />}
      </View>
    );
  }

  const { channel, pages, currentPage, content } = data;
  const share = () =>
    Share.share({ message: `${channel.title} on Believe The Works: ${config.siteUrl}/channel/${channel.slug}` });

  return (
    <>
      <Stack.Screen options={{ title: channel.title }} />
      <FlatList
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        data={content}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={styles.header}>
            {channel.bannerUrl ? (
              <Image source={channel.bannerUrl} style={styles.banner} contentFit="cover" accessible={false} />
            ) : null}
            <AppText variant="title">{channel.title}</AppText>
            {channel.authorName ? (
              <AppText variant="small" tone="secondary">
                By {channel.authorName}
              </AppText>
            ) : null}
            {channel.description ? <AppText tone="secondary">{channel.description}</AppText> : null}
            {channel.archived ? (
              <Notice tone="info">This channel is archived and only visible to you.</Notice>
            ) : null}
            <Button title="Share channel" variant="secondary" small onPress={share} style={styles.share} />
            {pages.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pages}>
                {pages.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.title}
                    selected={currentPage.slug === p.slug}
                    onPress={() => setPageSlug(p.slug)}
                  />
                ))}
              </ScrollView>
            ) : null}
            {currentPage.description ? (
              <AppText variant="small" tone="secondary">
                {currentPage.description}
              </AppText>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Card
              accessibilityLabel={item.title}
              onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}>
              <View style={styles.badges}>
                <Badge label={item.sharingLabel} />
                {item.type !== 'article' && item.type !== 'discussion' ? <Badge label={item.typeLabel} /> : null}
              </View>
              <AppText variant="heading">{item.title}</AppText>
              {item.bodySnippet ? (
                <AppText variant="small" tone="secondary" numberOfLines={3}>
                  {item.bodySnippet}
                </AppText>
              ) : null}
              <AppText variant="caption" tone="secondary">
                {timeAgo(item.createdAt)}
              </AppText>
            </Card>
          </View>
        )}
        ListEmptyComponent={
          loading ? <LoadingState /> : <EmptyState title="No posts on this page yet" />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.accent} />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { paddingBottom: Spacing.six, flexGrow: 1 },
  header: {
    padding: Spacing.three,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  banner: { width: '100%', aspectRatio: 3, borderRadius: Radius.lg },
  share: { alignSelf: 'flex-start' },
  pages: { gap: Spacing.two, paddingVertical: Spacing.two },
  item: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  badges: { flexDirection: 'row', gap: Spacing.two },
});
