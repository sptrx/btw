import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  const [tip, setTip] = useState<string | null>(null);
  const hideTip = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showTip(label: string) {
    if (hideTip.current) clearTimeout(hideTip.current);
    setTip(label);
  }

  function scheduleHideTip() {
    if (hideTip.current) clearTimeout(hideTip.current);
    hideTip.current = setTimeout(() => setTip(null), 900);
  }

  useEffect(() => {
    return () => {
      if (hideTip.current) clearTimeout(hideTip.current);
    };
  }, []);

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
    <View style={styles.wrap}>
      {tip ? (
        <View pointerEvents="none" style={[styles.tip, { backgroundColor: theme.primary }]}>
          <Text style={[styles.tipText, { color: theme.onPrimary }]}>{tip}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {REACTIONS.map((r) => {
          const selected = state.mine === r.type;
          const count = state.counts[r.type];
          const label = r.type === 'sharing' ? 'Sharing. Opens the share sheet.' : r.label;
          return (
            <Pressable
              key={r.type}
              onPressIn={() => showTip(label)}
              onPressOut={scheduleHideTip}
              onPress={() => choose(r.type)}
              accessibilityRole="button"
              accessibilityLabel={
                r.type === 'sharing' ? `Share, ${count}` : `${r.label}, ${count}`
              }
              accessibilityState={{ selected }}
              hitSlop={4}
              style={[
                styles.pill,
                {
                  borderColor: selected ? theme.accent : theme.border,
                  backgroundColor: selected ? theme.accentSoft : 'transparent',
                },
              ]}>
              <Text style={[styles.emoji, selected && { transform: [{ scale: 1.08 }] }]}>{r.emoji}</Text>
              {count > 0 ? (
                <AppText variant="caption" tone={selected ? 'primary' : 'secondary'} style={styles.count}>
                  {count}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.one, position: 'relative' },
  tip: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 6,
    zIndex: 20,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  tipText: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  pill: {
    minHeight: 32,
    minWidth: 36,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  emoji: { fontSize: 18 },
  count: { fontWeight: '600' },
});
