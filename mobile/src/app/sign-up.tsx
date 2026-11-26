import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { openSitePage } from '@/components/disclaimer';
import { AppText, Button, Checkbox, Notice, TextField } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';

/** Keep in sync with lib/password-policy.ts on the website and Supabase Auth settings. */
const MIN_PASSWORD_LENGTH = 10;
const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~";
const PASSWORD_RULES = [
  `At least ${MIN_PASSWORD_LENGTH} characters`,
  'A lowercase letter',
  'An uppercase letter',
  'A number',
  'A symbol',
];

function passwordPolicyError(password: string): string | null {
  const classes: string[] = [];
  if (!/[a-z]/.test(password)) classes.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) classes.push('an uppercase letter');
  if (!/[0-9]/.test(password)) classes.push('a number');
  if (![...password].some((ch) => PASSWORD_SYMBOLS.includes(ch))) classes.push('a symbol');

  const parts: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) parts.push(`be at least ${MIN_PASSWORD_LENGTH} characters`);
  if (classes.length > 0) {
    const list =
      classes.length === 1
        ? classes[0]
        : classes.length === 2
          ? `${classes[0]} and ${classes[1]}`
          : `${classes.slice(0, -1).join(', ')}, and ${classes[classes.length - 1]}`;
    parts.push(`include ${list}`);
  }
  if (parts.length === 0) return null;
  const requirement = parts.length === 1 ? parts[0] : `${parts[0]} and ${parts[1]}`;
  return `Password must ${requirement}.`;
}

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
    const policyError = passwordPolicyError(password);
    if (policyError) {
      setError(policyError);
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
      />
      <View style={styles.rules}>
        <AppText variant="caption">Password rules</AppText>
        {PASSWORD_RULES.map((rule) => (
          <AppText key={rule} variant="caption" tone="secondary">
            {'\u2022'} {rule}
          </AppText>
        ))}
      </View>
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
        title="Sign up"
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
  rules: {
    gap: 2,
    marginTop: -Spacing.two,
  },
});
