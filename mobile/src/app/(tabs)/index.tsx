import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { FeedCard } from '@/components/feed-card';
import { AppChrome } from '@/components/app-chrome';
import { WordOfGodPanel } from '@/components/word-of-god-panel';
import { AppText, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { FeedCursor, FeedItem, FeedPage } from '@/lib/types';

/** Only the short that is mostly on screen plays; the rest stay paused. */
const SHORT_VISIBILITY = { itemVisiblePercentThreshold: 60 };

type HomeTab = 'for_you' | 'following' | 'word';

export default function HomeScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [tab, setTab] = useState<HomeTab>('for_you');

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <AppChrome>
        <View style={[styles.tabs, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
          {(
            [
              { id: 'for_you', label: 'For you' },
              { id: 'following', label: 'Following' },
              { id: 'word', label: 'Word of God' },
            ] as const
          ).map((t) => {
            const selected = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tab, selected && { borderBottomColor: theme.accent }]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}>
                <AppText
                  variant="small"
                  tone={selected ? 'default' : 'secondary'}
                  style={selected ? styles.tabSelected : styles.tabIdle}>
                  {t.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {tab === 'word' ? (
          <ScrollView contentContainerStyle={styles.wordScroll} contentInsetAdjustmentBehavior="automatic">
            <WordOfGodPanel />
          </ScrollView>
        ) : (
          <FeedList
            key={`${tab}:${session?.user.id ?? ''}`}
            mode={tab}
            signedIn={Boolean(session)}
          />
        )}
      </AppChrome>
    </View>
  );
}

type Status = 'loading' | 'refreshing' | 'more' | 'idle';

function FeedList({
  mode,
  signedIn,
}: {
  mode: 'for_you' | 'following';
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
    api<FeedPage>('feed', { mode, cursor: null }).then(
      (page) => !cancelled && apply(page, false),
      (e) => !cancelled && fail(e)
    );
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const [activeShortId, setActiveShortId] = useState<string | null>(null);
  // Stable identity: FlatList rejects an onViewableItemsChanged that changes between renders.
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { item: FeedItem }[] }) => {
      const short = viewableItems.find((v) => v.item?.postKind === 'short');
      setActiveShortId(short ? short.item.id : null);
    },
    []
  );

  function load(s: Exclude<Status, 'idle'>) {
    const after = s === 'more' ? cursor : null;
    setStatus(s);
    api<FeedPage>('feed', { mode, cursor: after }).then((page) => apply(page, Boolean(after)), fail);
  }

  if (mode === 'following' && !signedIn) {
    return (
      <EmptyState
        title="Follow people you love"
        message="Sign in to see posts from people and channels you follow."
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => `${item.postKind}:${item.id}`}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <FeedCard item={item} shortActive={item.id === activeShortId} />
        </View>
      )}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={SHORT_VISIBILITY}
      ListEmptyComponent={
        status === 'loading' ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load('loading')} />
        ) : (
          <EmptyState title="Nothing here yet" message="Check back soon for new posts." />
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
  fill: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabSelected: { fontWeight: '700' },
  tabIdle: { fontWeight: '500' },
  list: { paddingBottom: Spacing.six, flexGrow: 1 },
  item: {
    paddingHorizontal: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  footer: { padding: Spacing.four },
  wordScroll: { paddingBottom: Spacing.six },
});
