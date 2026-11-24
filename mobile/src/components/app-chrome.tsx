import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useDrawer } from '@/lib/drawer';

/** Top bar on every main tab: menu (left) + signed-in first name (right). */
export function AppChrome({ children }: { children?: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { session, me } = useAuth();
  const name =
    me?.profile?.display_name?.trim().split(/\s+/)[0] ||
    me?.profile?.username ||
    (session ? 'You' : null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={[
          styles.bar,
          {
            paddingTop: insets.top + Spacing.one,
            borderBottomColor: theme.border,
            backgroundColor: theme.background,
          },
        ]}>
        <Pressable
          onPress={openDrawer}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          style={styles.iconBtn}>
          <Icon ios="line.3.horizontal" md="menu" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.brand} accessibilityLabel="Believe The Works">
          <AppText variant="title" style={[styles.mark, { color: theme.accent }]}>
            BTW
          </AppText>
          <AppText variant="caption" tone="secondary" style={styles.sub}>
            Believe The Works
          </AppText>
        </View>
        <Pressable
          style={styles.right}
          onPress={() => {
            if (!session) router.push('/sign-in');
            else {
              const key = me?.profile?.username || me?.user?.id;
              if (key) router.push(`/library/${key}` as never);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={name ? `Open ${name}'s library` : 'Sign in'}>
          <AppText variant="small" tone={name ? 'secondary' : 'primary'} numberOfLines={1}>
            {name ?? 'Sign in'}
          </AppText>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one + 2,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { minWidth: 44, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1 },
  mark: { fontSize: 22, lineHeight: 24, letterSpacing: 1 },
  sub: { fontSize: 10, lineHeight: 12 },
  right: { maxWidth: 140, alignItems: 'flex-end', minHeight: 40, justifyContent: 'center' },
});
