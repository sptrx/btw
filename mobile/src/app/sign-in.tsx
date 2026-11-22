import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { openSitePage } from '@/components/disclaimer';
import { AppText, Button, Notice, TextField } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) {
      setError(
        authError.message.toLowerCase().includes('email not confirmed')
          ? 'Please confirm your email first. Check your inbox for the link we sent.'
          : authError.message
      );
      return;
    }
    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <AppText variant="title">Welcome back</AppText>
      <AppText tone="secondary">Sign in with your Believe The Works account.</AppText>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={signIn}
      />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button title="Sign in" onPress={signIn} loading={loading} disabled={!email.trim() || !password} />
      <Button title="Forgot password?" variant="ghost" onPress={() => openSitePage('/auth/forgot-password')} />
      <Button title="Create an account" variant="secondary" onPress={() => router.replace('/sign-up')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
