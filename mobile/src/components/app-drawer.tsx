import { useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openSitePage } from '@/components/disclaimer';
import { AppText, Button, Divider, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
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
          label: `${name.split(/\s+/)[0]}'s Library`,
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
          label: 'Create account',
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
      label: 'Create a channel',
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
    { label: 'About', icon: { ios: 'info.circle', md: 'info' }, onPress: () => { closeDrawer(); openSitePage('/about'); } },
    { label: 'Donate', icon: { ios: 'heart', md: 'volunteer_activism' }, onPress: () => { closeDrawer(); openSitePage('/donate'); } },
    { label: 'Invite others', icon: { ios: 'envelope', md: 'share' }, onPress: () => { closeDrawer(); openSitePage('/invite'); } },
    { label: 'Contact', icon: { ios: 'bubble.left', md: 'mail' }, onPress: () => { closeDrawer(); openSitePage('/contact'); } },
    { label: 'Community guidelines', icon: { ios: 'doc.text', md: 'description' }, onPress: () => { closeDrawer(); openSitePage('/legal/community-guidelines'); } },
  ];

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeDrawer} accessibilityLabel="Close menu" />
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.background,
              paddingTop: insets.top + Spacing.three,
              paddingBottom: insets.bottom + Spacing.three,
              borderRightColor: theme.border,
            },
          ]}>
          <View style={styles.brandRow}>
            <AppText variant="heading">Believe The Works</AppText>
            <Pressable onPress={closeDrawer} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Icon ios="xmark" md="close" color={theme.textSecondary} />
            </Pressable>
          </View>
          <AppText variant="small" tone="secondary" numberOfLines={1}>
            {session ? name : 'Welcome — sign in to personalize'}
          </AppText>

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
            { backgroundColor: pressed ? theme.muted : 'transparent' },
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    width: '82%',
    maxWidth: 340,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { flex: 1, marginTop: Spacing.three },
  scrollContent: { gap: Spacing.three, paddingBottom: Spacing.four },
  section: { gap: Spacing.one },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.one },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
  },
  itemLabel: { flex: 1 },
});
