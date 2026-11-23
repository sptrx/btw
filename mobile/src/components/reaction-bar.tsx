import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { REACTIONS, type PostKind, type ReactionCounts, type ReactionType } from '@/lib/types';

const EMPTY: ReactionCounts = { amen: 0, blessed: 0, spirit_filled: 0, sharing: 0, praise_god: 0 };

export function ReactionBar({
  postId,
  postKind,
  counts,
  userReaction,
  shareUrl,
  shareTitle,
}: {
  postId: string;
  postKind: PostKind;
  counts: ReactionCounts | null;
  userReaction: ReactionType | null;
  /** When set, tapping Sharing opens the system share sheet. */
  shareUrl?: string | null;
  shareTitle?: string | null;
}) {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [state, setState] = useState({ counts: counts ?? EMPTY, mine: userReaction });

  async function openShare() {
    if (!shareUrl) return;
    try {
      await Share.share({
        message: shareTitle ? `${shareTitle}\n${shareUrl}` : shareUrl,
        url: shareUrl,
        title: shareTitle ?? undefined,
      });
    } catch {
      /* user cancelled */
    }
  }

  async function choose(type: ReactionType) {
    if (type === 'sharing') {
      await openShare();
    }

    if (!session) {
      if (type !== 'sharing') router.push('/sign-in');
      return;
    }

    const previous = state;
    // Sharing always shares; don't clear the reaction if already selected.
    if (type === 'sharing' && previous.mine === 'sharing') {
      return;
    }

    const next = previous.mine === type ? null : type;
    const nextCounts = { ...previous.counts };
    if (previous.mine) nextCounts[previous.mine] = Math.max(0, nextCounts[previous.mine] - 1);
    if (next) nextCounts[next] += 1;
    setState({ counts: nextCounts, mine: next });
    Haptics.selectionAsync().catch(() => {});

    try {
      await api('react', { postId, postKind, reaction: next ?? '' });
    } catch (e) {
      setState(previous);
      Alert.alert('Could not save your response', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <View style={styles.row}>
      {REACTIONS.map((r) => {
        const selected = state.mine === r.type;
        const count = state.counts[r.type];
        return (
          <Pressable
            key={r.type}
            onPress={() => choose(r.type)}
            accessibilityRole="button"
            accessibilityLabel={
              r.type === 'sharing' ? `Share, ${count}` : `${r.label}, ${count}`
            }
            accessibilityState={{ selected }}
            hitSlop={4}
            style={[
              styles.pill,
              { borderColor: selected ? theme.accent : theme.border },
              selected && { backgroundColor: theme.muted },
            ]}>
            <Text style={styles.emoji}>{r.emoji}</Text>
            <AppText variant="caption" tone={selected ? 'primary' : 'secondary'}>
              {r.label}
            </AppText>
            {count > 0 ? (
              <AppText variant="caption" tone={selected ? 'primary' : 'secondary'} style={styles.count}>
                {count}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pill: {
    minHeight: 36,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  emoji: { fontSize: 16 },
  count: { fontWeight: '600' },
});
