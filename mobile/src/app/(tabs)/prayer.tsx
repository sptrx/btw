import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppChrome } from '@/components/app-chrome';
import { PrayButton } from '@/components/pray-button';
import {
  AppText,
  Badge,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import type { PraiseReport, PrayerFilter, PrayerRequest } from '@/lib/types';

const FILTERS: { id: PrayerFilter; label: string; signedIn?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'answered', label: 'Answered' },
  { id: 'mine', label: 'Mine', signedIn: true },
];

export default function PrayerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [filter, setFilter] = useState<PrayerFilter>('all');
  const { data, error, loading, refreshing, reload } = useApi<{
    requests: PrayerRequest[];
    praise: PraiseReport[];
  }>('prayers', { filter });

  const praise = data?.praise.slice(0, 3) ?? [];

  return (
    <AppChrome>
      <FlatList
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.list}
        data={data?.requests ?? []}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <AppText variant="title">Prayer Wall</AppText>
              <AppText variant="small" tone="secondary">
                Lift each other up. Tap “I prayed” when you pray.
              </AppText>
              {!session ? (
                <AppText variant="caption" tone="secondary">
                  Ask: share a need, by name or anonymously. Pray: tap “I prayed” so they know. Celebrate: answered
                  requests become praise reports. Requests are checked by AI moderation first.
                </AppText>
              ) : null}
              <Button
                title="Ask for prayer"
                onPress={() => router.push(session ? '/prayer/new' : '/sign-in')}
                style={styles.cta}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}>
              {FILTERS.filter((f) => session || !f.signedIn).map((f) => (
                <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
              ))}
            </ScrollView>
            {praise.length ? (
              <View style={styles.praiseBlock}>
                <AppText variant="label" tone="secondary">
                  Praise reports
                </AppText>
                {praise.map((p) => (
                  <View key={p.id} style={[styles.praiseRow, { borderBottomColor: theme.border }]}>
                    <AppText variant="caption" tone="success">
                      Answered{p.prayerRequestTitle ? ` · ${p.prayerRequestTitle}` : ''}
                    </AppText>
                    <AppText variant="small" numberOfLines={3}>
                      {p.body}
                    </AppText>
                    <AppText variant="caption" tone="secondary">
                      {[p.authorDisplayName, timeAgo(p.createdAt)].filter(Boolean).join(' · ')}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <PrayerRow request={item} />}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <EmptyState
              title={filter === 'mine' ? 'You have no prayer requests' : 'No prayer requests here'}
              message="Share what's on your heart and the community will pray with you."
            />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.accent} />}
      />
    </AppChrome>
  );
}

function PrayerRow({ request }: { request: PrayerRequest }) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={request.title}
      onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: request.id } })}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border, opacity: pressed ? 0.88 : 1 },
      ]}>
      <View style={styles.rowTop}>
        {request.status === 'answered' ? <Badge label="Answered" /> : null}
        <AppText variant="caption" tone="secondary">
          {timeAgo(request.createdAt)}
        </AppText>
      </View>
      <AppText variant="heading" numberOfLines={3}>
        {request.title}
      </AppText>
      <AppText variant="small" tone="secondary" numberOfLines={3}>
        {request.body}
      </AppText>
      <AppText variant="caption" tone="secondary">
        {request.authorDisplayName ?? 'Community member'}
      </AppText>
      <View style={styles.actions}>
        <PrayButton
          key={`${request.userIsPraying}:${request.prayerCount}`}
          requestId={request.id}
          praying={request.userIsPraying}
          count={request.prayerCount}
        />
      </View>
    </Pressable>
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
    gap: Spacing.one,
  },
  cta: { alignSelf: 'flex-start', marginTop: Spacing.two },
  filters: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  praiseBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  praiseRow: {
    paddingVertical: Spacing.three,
    gap: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  actions: { flexDirection: 'row', marginTop: Spacing.one },
});
