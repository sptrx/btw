import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { FeedCard } from '@/components/feed-card';
import { Chip, EmptyState, ErrorState, LoadingState, ScreenHeader } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FEED_FILTERS, type FeedCursor, type FeedFilter, type FeedItem, type FeedPage } from '@/lib/types';

export default function FeedScreen() {
  const { session } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const userId = session?.user.id ?? '';
  return <FeedList key={`${filter}:${userId}`} filter={filter} onFilterChange={setFilter} signedIn={!!userId} />;
}

type Status = 'loading' | 'refreshing' | 'more' | 'idle';

function FeedList({
  filter,
  onFilterChange,
  signedIn,
}: {
  filter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  signedIn: boolean;
}) {
  const theme = useTheme();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<FeedCursor | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  function apply(page: FeedPage, append: boolean) {
    setItems((prev) => (append ? [...prev, ...page.items] : page.items));
    setCursor(page.nextCursor);
    setError(null);
    setStatus('idle');
  }

  function fail(e: unknown) {
    setError(e instanceof Error ? e.message : 'Could not load the feed.');
    setStatus('idle');
  }

  useEffect(() => {
    let cancelled = false;
    api<FeedPage>('feed', { filter, cursor: null }).then(
      (page) => !cancelled && apply(page, false),
      (e) => !cancelled && fail(e)
    );
    return () => {
      cancelled = true;
    };
  }, [filter]);

  function load(mode: Exclude<Status, 'idle'>) {
    const after = mode === 'more' ? cursor : null;
    setStatus(mode);
    api<FeedPage>('feed', { filter, cursor: after }).then((page) => apply(page, Boolean(after)), fail);
  }

  const header = (
    <View>
      <ScreenHeader title="Feed" subtitle="Testimonies, prayer and teaching from the community" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FEED_FILTERS.filter((f) => signedIn || f.id !== 'following').map((f) => (
          <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => onFilterChange(f.id)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      contentInsetAdjustmentBehavior="automatic"
      data={items}
      keyExtractor={(item) => `${item.postKind}:${item.id}`}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <FeedCard item={item} />
        </View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        status === 'loading' ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load('loading')} />
        ) : (
          <EmptyState title="Nothing here yet" message="Try another filter, or check back soon." />
        )
      }
      ListFooterComponent={
        status === 'more' ? <ActivityIndicator style={styles.footer} color={theme.accent} /> : undefined
      }
      onEndReachedThreshold={0.6}
      onEndReached={() => {
        if (cursor && status === 'idle' && !error) load('more');
      }}
      refreshControl={
        <RefreshControl
          refreshing={status === 'refreshing'}
          onRefresh={() => load('refreshing')}
          tintColor={theme.accent}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.six, flexGrow: 1 },
  filters: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.two },
  item: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  footer: { padding: Spacing.four },
});
