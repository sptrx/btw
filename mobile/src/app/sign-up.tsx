import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { openSitePage } from '@/components/disclaimer';
import { AppText, Button, Checkbox, Notice, TextField } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';

/** Keep in sync with lib/password-policy.ts on the website and Supabase Auth settings. */
const MIN_PASSWORD_LENGTH = 10;

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function signUp() {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), role: 'user' },
        emailRedirectTo: `${config.siteUrl}/auth/callback?next=${encodeURIComponent('/auth/confirmed')}`,
      },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (data.user?.identities?.length === 0) {
      setError('This email is already registered. Try signing in instead.');
      return;
    }
    if (data.session) {
      router.back();
      return;
    }
    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
        <AppText variant="title">Check your email</AppText>
        <AppText>
          We sent a confirmation link to {sentTo}. Open it to verify your account, then come back and sign in.
        </AppText>
        <AppText tone="secondary">Didn&apos;t see it? Check your spam folder.</AppText>
        <Button title="Go to sign in" onPress={() => router.replace('/sign-in')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <AppText variant="title">Join Believe The Works</AppText>
      <AppText tone="secondary">
        Share your witness, pray for others and join conversations in a safe, AI-moderated community.
      </AppText>
      <TextField label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
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
        autoComplete="new-password"
        textContentType="newPassword"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
      />
      <Checkbox checked={acceptedTerms} onChange={setAcceptedTerms}>
        <AppText variant="small">
          I agree to the{' '}
          <AppText variant="small" tone="primary" onPress={() => openSitePage('/legal/terms')}>
            terms
          </AppText>{' '}
          and{' '}
          <AppText variant="small" tone="primary" onPress={() => openSitePage('/legal/community-guidelines')}>
            community guidelines
          </AppText>
          .
        </AppText>
      </Checkbox>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button
        title="Create account"
        onPress={signUp}
        loading={loading}
        disabled={!name.trim() || !email.trim() || !password || !acceptedTerms}
      />
      <Button title="I already have an account" variant="ghost" onPress={() => router.replace('/sign-in')} />
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
