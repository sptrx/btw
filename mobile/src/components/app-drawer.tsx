import { useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openSitePage } from '@/components/disclaimer';
import { AppText, Button, Divider, Icon } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useDrawer } from '@/lib/drawer';

type Item = {
  label: string;
  icon: { ios: Parameters<typeof Icon>[0]['ios']; md: Parameters<typeof Icon>[0]['md'] };
  onPress: () => void;
};

export function AppDrawer() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { open, closeDrawer } = useDrawer();
  const { session, me, signOut } = useAuth();

  const name =
    me?.profile?.display_name?.trim() ||
    me?.profile?.username ||
    me?.user?.email ||
    'Guest';
  const libraryKey = me?.profile?.username || me?.user?.id;

  function go(path: string) {
    closeDrawer();
    router.push(path as never);
  }

  const accountItems: Item[] = session
    ? [
        {
          label: 'Library',
          icon: { ios: 'book', md: 'menu_book' },
          onPress: () => go(libraryKey ? `/library/${libraryKey}` : '/library'),
        },
        {
          label: 'Edit profile',
          icon: { ios: 'person.crop.circle', md: 'manage_accounts' },
          onPress: () => go('/profile-edit'),
        },
        {
          label: 'Notification alerts',
          icon: { ios: 'bell', md: 'notifications' },
          onPress: () => go('/notifications'),
        },
        {
          label: 'Security & account',
          icon: { ios: 'lock', md: 'security' },
          onPress: () => go('/settings'),
        },
      ]
    : [
        {
          label: 'Sign in',
          icon: { ios: 'person.crop.circle', md: 'login' },
          onPress: () => go('/sign-in'),
        },
        {
          label: 'Sign up',
          icon: { ios: 'person.badge.plus', md: 'person_add' },
          onPress: () => go('/sign-up'),
        },
      ];

  const communityItems: Item[] = [
    {
      label: 'Browse channels',
      icon: { ios: 'square.stack', md: 'video_library' },
      onPress: () => go('/channels'),
    },
    {
      label: 'Create channel',
      icon: { ios: 'plus.circle', md: 'create_new_folder' },
      onPress: () => {
        closeDrawer();
        if (!session) go('/sign-in');
        else openSitePage('/channel/new');
      },
    },
    {
      label: 'Explore',
      icon: { ios: 'safari', md: 'explore' },
      onPress: () => {
        closeDrawer();
        openSitePage('/explore');
      },
    },
  ];

  const moreItems: Item[] = [
    {
      label: 'About',
      icon: { ios: 'info.circle', md: 'info' },
      onPress: () => {
        closeDrawer();
        openSitePage('/about');
      },
    },
    {
      label: 'Donate',
      icon: { ios: 'heart', md: 'volunteer_activism' },
      onPress: () => {
        closeDrawer();
        openSitePage('/donate');
      },
    },
    {
      label: 'Invite',
      icon: { ios: 'envelope', md: 'share' },
      onPress: () => {
        closeDrawer();
        openSitePage('/invite');
      },
    },
    {
      label: 'Contact',
      icon: { ios: 'bubble.left', md: 'mail' },
      onPress: () => {
        closeDrawer();
        openSitePage('/contact');
      },
    },
    {
      label: 'Community guidelines',
      icon: { ios: 'doc.text', md: 'description' },
      onPress: () => {
        closeDrawer();
        openSitePage('/legal/community-guidelines');
      },
    },
  ];

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.card,
              paddingTop: insets.top + Spacing.two,
              paddingBottom: insets.bottom + Spacing.three,
              borderRightColor: theme.border,
            },
          ]}>
          <View style={[styles.brandBlock, { borderBottomColor: theme.border }]}>
            <View style={styles.brandRow}>
              <AppText variant="label">BTW</AppText>
              <Pressable
                onPress={closeDrawer}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close">
                <Icon ios="xmark" md="close" color={theme.textSecondary} />
              </Pressable>
            </View>
            <AppText variant="heading">Believe The Works</AppText>
            <AppText variant="small" tone="secondary" numberOfLines={1}>
              {session ? name : 'Welcome — sign in to personalize'}
            </AppText>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Section title="You" items={accountItems} />
            <Divider />
            <Section title="Community" items={communityItems} />
            <Divider />
            <Section title="More" items={moreItems} />
          </ScrollView>

          {session ? (
            <Button
              title="Sign out"
              variant="secondary"
              onPress={() => {
                closeDrawer();
                signOut();
              }}
            />
          ) : null}
        </View>
        <Pressable style={styles.backdrop} onPress={closeDrawer} accessibilityLabel="Close menu" />
      </View>
    </Modal>
  );
}

function Section({ title, items }: { title: string; items: Item[] }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="caption" tone="secondary" style={styles.sectionTitle}>
        {title}
      </AppText>
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.item,
            {
              borderBottomColor: theme.border,
              backgroundColor: pressed ? theme.accentSoft : 'transparent',
            },
          ]}
          accessibilityRole="button">
          <Icon ios={item.icon.ios} md={item.icon.md} size={18} color={theme.accent} />
          <AppText style={styles.itemLabel}>{item.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: {
    width: '82%',
    maxWidth: 340,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  brandBlock: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { flex: 1, marginTop: Spacing.two },
  scrollContent: { gap: Spacing.three, paddingBottom: Spacing.four },
  section: { gap: 0 },
  sectionTitle: {
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
    marginTop: Spacing.one,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 48,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLabel: { flex: 1 },
});
