import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { openSitePage } from '@/components/disclaimer';
import { AppText, Button, Card, Divider, Icon, ScreenHeader } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

const LINKS = [
  { label: 'About Believe The Works', path: '/about' },
  { label: 'Community guidelines', path: '/legal/community-guidelines' },
  { label: 'Terms', path: '/legal/terms' },
  { label: 'Content disclaimer', path: '/legal/content-disclaimer' },
  { label: 'Contact us', path: '/contact' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, me, refreshMe, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const profile = me?.profile;

  async function refresh() {
    setRefreshing(true);
    await refreshMe();
    setRefreshing(false);
  }

  function confirmSignOut() {
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  const links = (
    <Card>
      {LINKS.map((l, i) => (
        <View key={l.path}>
          {i > 0 ? <Divider /> : null}
          <Button title={l.label} variant="ghost" small onPress={() => openSitePage(l.path)} style={styles.link} />
        </View>
      ))}
    </Card>
  );

  if (!session) {
    return (
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic">
        <ScreenHeader title="Profile" />
        <View style={styles.body}>
          <Card>
            <AppText variant="heading">Join the community</AppText>
            <AppText tone="secondary">
              Sign in to react, comment, pray for others and share your own prayer requests.
            </AppText>
            <Button title="Sign in" onPress={() => router.push('/sign-in')} />
            <Button title="Create account" variant="secondary" onPress={() => router.push('/sign-up')} />
          </Card>
          {links}
        </View>
      </ScrollView>
    );
  }

  const name = profile?.display_name?.trim() || 'Your profile';
  const place = [profile?.city, profile?.country_code].filter(Boolean).join(', ');

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}>
      <ScreenHeader title="Profile" />
      <View style={styles.body}>
        <Card>
          <View style={styles.identity}>
            {profile?.avatar_url ? (
              <Image source={profile.avatar_url} style={styles.avatar} accessibilityLabel="Profile photo" />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: theme.muted }]}>
                <Icon ios="person.fill" md="person" size={28} color={theme.textSecondary} />
              </View>
            )}
            <View style={styles.flex}>
              <AppText variant="heading">{name}</AppText>
              {profile?.username ? (
                <AppText variant="small" tone="secondary">
                  @{profile.username}
                </AppText>
              ) : null}
              {me?.user?.email ? (
                <AppText variant="caption" tone="secondary">
                  {me.user.email}
                </AppText>
              ) : null}
            </View>
          </View>
          {profile?.ministry_name ? <AppText variant="label">{profile.ministry_name}</AppText> : null}
          {profile?.bio ? <AppText tone="secondary">{profile.bio}</AppText> : null}
          {place ? (
            <AppText variant="small" tone="secondary">
              {place}
            </AppText>
          ) : null}
          {me?.follows ? (
            <AppText variant="small" tone="secondary">
              {me.follows.followers} followers · {me.follows.following} following
            </AppText>
          ) : null}
          <Button title="Edit profile" variant="secondary" onPress={() => router.push('/profile-edit')} />
        </Card>

        {links}

        <Button title="Sign out" variant="secondary" onPress={confirmSignOut} />
        <Button title="Delete account" variant="ghost" onPress={() => router.push('/delete-account')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: Spacing.six },
  body: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 64, height: 64, borderRadius: Radius.pill },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  link: { justifyContent: 'flex-start', paddingHorizontal: 0 },
});
