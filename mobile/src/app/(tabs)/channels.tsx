import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppChrome } from '@/components/app-chrome';
import { AppText, Card, EmptyState, ErrorState, LoadingState, TextField } from '@/components/ui';
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
          <View>
            <View style={styles.titleBlock}>
              <AppText variant="title">Channels</AppText>
              <AppText variant="small" tone="secondary">
                Search ministries, pages, and creators on BTW
              </AppText>
            </View>
            <View style={styles.search}>
              <TextField
                value={query}
                onChangeText={setQuery}
                placeholder="Search channels & pages"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
                accessibilityLabel="Search channels and pages"
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Card
              accessibilityLabel={item.title}
              onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: item.slug } })}>
              {item.bannerUrl ? (
                <Image source={item.bannerUrl} style={styles.banner} contentFit="cover" accessible={false} />
              ) : null}
              <AppText variant="heading">{item.title}</AppText>
              {item.description ? (
                <AppText variant="small" tone="secondary" numberOfLines={3}>
                  {item.description}
                </AppText>
              ) : null}
              <AppText variant="caption" tone="secondary">
                {[item.authorName, plural(item.postCount, 'post'), plural(item.followerCount, 'follower')]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            </Card>
          </View>
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
  list: { paddingBottom: Spacing.six, flexGrow: 1 },
  titleBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  search: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  item: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  banner: { width: '100%', aspectRatio: 3, borderRadius: Radius.md },
});
