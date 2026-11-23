import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppChrome } from '@/components/app-chrome';
import { AppText, EmptyState, ErrorState, LoadingState, TextField } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { plural } from '@/lib/format';
import type { ChannelListItem } from '@/lib/types';

export default function ChannelsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, error, loading, refreshing, reload } = useApi<ChannelListItem[]>('channels', { search });

  return (
    <AppChrome>
      <FlatList
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        data={data ?? []}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="title">Channels</AppText>
            <AppText variant="small" tone="secondary">
              Search ministries, pages, and creators
            </AppText>
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Search channels & pages"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              accessibilityLabel="Search channels and pages"
              style={[styles.searchInput, { backgroundColor: theme.muted, borderColor: theme.border }]}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: item.slug } })}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomColor: theme.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
            {item.bannerUrl ? (
              <Image source={item.bannerUrl} style={styles.thumb} contentFit="cover" accessible={false} />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: theme.accentSoft }]}>
                <AppText variant="label" tone="primary">
                  {item.title.slice(0, 1).toUpperCase()}
                </AppText>
              </View>
            )}
            <View style={styles.rowBody}>
              <AppText variant="heading" numberOfLines={2}>
                {item.title}
              </AppText>
              {item.description ? (
                <AppText variant="small" tone="secondary" numberOfLines={2}>
                  {item.description}
                </AppText>
              ) : null}
              <AppText variant="caption" tone="secondary">
                {[item.authorName, plural(item.postCount, 'post'), plural(item.followerCount, 'follower')]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <EmptyState title={search ? 'No matching channels' : 'No channels yet'} />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.accent} />}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: Spacing.six,
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  searchInput: {
    marginTop: Spacing.two,
    borderRadius: Radius.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: Spacing.one },
});
