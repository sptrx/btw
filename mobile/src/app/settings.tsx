import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { openSitePage } from '@/components/disclaimer';
import { AppText, Button, Card } from '@/components/ui';
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
      <Card>
        <AppText variant="heading">Account</AppText>
        <AppText tone="secondary">{me?.user?.email}</AppText>
        <Button title="Edit profile" variant="secondary" onPress={() => router.push('/profile-edit')} />
        <Button
          title="Change password"
          variant="secondary"
          onPress={() => openSitePage('/auth/forgot-password')}
        />
      </Card>

      <Card>
        <AppText variant="heading">Security</AppText>
        <AppText tone="secondary">
          Password reset, email change, and signing out of other devices are available on the website dashboard.
        </AppText>
        <Button title="Open security on the web" variant="secondary" onPress={() => openSitePage('/dashboard/settings')} />
      </Card>

      <Card>
        <AppText variant="heading">Alerts</AppText>
        <Button title="Notification choices" variant="secondary" onPress={() => router.push('/notifications')} />
      </Card>

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

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  danger: { gap: Spacing.two, marginTop: Spacing.two },
});
