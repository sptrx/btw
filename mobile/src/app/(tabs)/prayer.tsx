import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppChrome } from '@/components/app-chrome';
import { PrayButton } from '@/components/pray-button';
import {
  AppText,
  Badge,
  Button,
  Card,
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
          <View style={styles.titleBlock}>
            <AppText variant="title">Prayer Wall</AppText>
            <AppText variant="small" tone="secondary">
              Lift each other up. Tap “I prayed” when you pray.
            </AppText>
          </View>
          <View style={styles.section}>
            <Button
              title="Ask for prayer"
              onPress={() => router.push(session ? '/prayer/new' : '/sign-in')}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTERS.filter((f) => session || !f.signedIn).map((f) => (
              <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
            ))}
          </ScrollView>
          {praise.length ? (
            <View style={styles.section}>
              <AppText variant="heading">Praise reports</AppText>
              {praise.map((p) => (
                <Card key={p.id}>
                  <AppText variant="caption" tone="success">
                    Answered prayer{p.prayerRequestTitle ? ` · ${p.prayerRequestTitle}` : ''}
                  </AppText>
                  <AppText variant="small" numberOfLines={4}>
                    {p.body}
                  </AppText>
                  <AppText variant="caption" tone="secondary">
                    {[p.authorDisplayName, timeAgo(p.createdAt)].filter(Boolean).join(' · ')}
                  </AppText>
                </Card>
              ))}
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <PrayerCard request={item} />
        </View>
      )}
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

function PrayerCard({ request }: { request: PrayerRequest }) {
  const router = useRouter();
  return (
    <Card
      accessibilityLabel={request.title}
      onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: request.id } })}>
      {request.status === 'answered' ? <Badge label="Answered" /> : null}
      <AppText variant="heading">{request.title}</AppText>
      <AppText variant="small" tone="secondary" numberOfLines={4}>
        {request.body}
      </AppText>
      <AppText variant="caption" tone="secondary">
        {[
          request.authorDisplayName ?? 'Community member',
          timeAgo(request.createdAt),
          request.countryFlag ? `${request.countryFlag} ${request.countryName ?? ''}`.trim() : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </AppText>
      <View style={styles.actions}>
        <PrayButton
          key={`${request.userIsPraying}:${request.prayerCount}`}
          requestId={request.id}
          praying={request.userIsPraying}
          count={request.prayerCount}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.six, flexGrow: 1 },
  titleBlock: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.one },
  section: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  filters: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.two },
  item: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  actions: { flexDirection: 'row' },
});
