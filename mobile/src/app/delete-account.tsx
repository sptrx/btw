import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText, Button, Notice, TextField } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function DeleteAccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPassword = (session?.user.identities ?? []).some((i) => i.provider === 'email');

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      await api('account.delete', { confirmText: confirmText.trim(), password });
      await signOut().catch(() => {});
      router.dismissAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete your account.');
      setDeleting(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <AppText variant="heading">This permanently deletes your account</AppText>
      <AppText tone="secondary">
        Your profile, posts, prayer requests, comments and reactions will be removed. This cannot be undone.
      </AppText>
      <TextField
        label="Type DELETE to confirm"
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {hasPassword ? (
        <TextField
          label="Current password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button
        title="Delete my account"
        variant="danger"
        onPress={remove}
        loading={deleting}
        disabled={confirmText.trim() !== 'DELETE' || (hasPassword && !password)}
      />
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
});
