import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppDrawer } from '@/components/app-drawer';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { DrawerProvider } from '@/lib/drawer';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <DrawerProvider>
        <RootStack />
      </DrawerProvider>
    </AuthProvider>
  );
}

function RootStack() {
  const { ready } = useAuth();
  const scheme = useColorScheme();
  const theme = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: theme.accent,
          background: theme.background,
          card: theme.background,
          text: theme.text,
          border: theme.border,
        },
      }}>
      <StatusBar style="auto" />
      <AppDrawer />
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerTintColor: theme.accent }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: '' }} />
        <Stack.Screen name="channel/[slug]" options={{ title: '' }} />
        <Stack.Screen name="library/index" options={{ title: 'Library' }} />
        <Stack.Screen name="library/[username]" options={{ title: 'Library' }} />
        <Stack.Screen name="settings" options={{ title: 'Security & account' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notification alerts' }} />
        <Stack.Screen name="prayer/[id]" options={{ title: 'Prayer request' }} />
        <Stack.Screen name="prayer/new" options={{ title: 'Ask for prayer', presentation: 'modal' }} />
        <Stack.Screen name="sign-in" options={{ title: 'Sign in', presentation: 'modal' }} />
        <Stack.Screen name="sign-up" options={{ title: 'Create account', presentation: 'modal' }} />
        <Stack.Screen name="profile-edit" options={{ title: 'Edit profile', presentation: 'modal' }} />
        <Stack.Screen name="delete-account" options={{ title: 'Delete account', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
