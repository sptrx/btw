import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { openSitePage } from '@/components/disclaimer';
import { AppText, Button } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, me, signOut } = useAuth();

  if (!session) {
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
        <AppText>Sign in to manage security settings.</AppText>
        <Button title="Sign in" onPress={() => router.push('/sign-in')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <Section title="Account">
        <AppText tone="secondary">{me?.user?.email}</AppText>
        <Row label="Edit profile" onPress={() => router.push('/profile-edit')} />
        <Row label="Change password" onPress={() => openSitePage('/auth/forgot-password')} />
      </Section>

      <Section title="Security">
        <AppText variant="small" tone="secondary">
          Password reset, email change, and signing out of other devices are available on the website
          dashboard.
        </AppText>
        <Row label="Open security on the web" onPress={() => openSitePage('/dashboard/settings')} />
      </Section>

      <Section title="Alerts">
        <Row label="Notification choices" onPress={() => router.push('/notifications')} />
      </Section>

      <View style={styles.danger}>
        <Button
          title="Sign out"
          variant="secondary"
          onPress={() =>
            Alert.alert('Sign out?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
            ])
          }
        />
        <Button title="Delete account" variant="ghost" onPress={() => router.push('/delete-account')} />
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <AppText variant="label" tone="secondary">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border, opacity: pressed ? 0.75 : 1 },
      ]}>
      <AppText>{label}</AppText>
      <AppText tone="secondary">›</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingBottom: Spacing.six,
  },
  section: { gap: Spacing.two, paddingBottom: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  danger: { gap: Spacing.two, marginTop: Spacing.two },
});
