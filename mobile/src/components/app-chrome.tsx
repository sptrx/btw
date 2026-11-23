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
      <View style={[styles.bar, { paddingTop: insets.top + Spacing.two, borderBottomColor: theme.border }]}>
        <Pressable
          onPress={openDrawer}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          style={styles.iconBtn}>
          <Icon ios="line.3.horizontal" md="menu" size={22} color={theme.text} />
        </Pressable>
        <AppText variant="label" style={styles.brand}>
          BTW
        </AppText>
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
    paddingBottom: Spacing.two,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1 },
  right: { maxWidth: 140, alignItems: 'flex-end', minHeight: 44, justifyContent: 'center' },
});
