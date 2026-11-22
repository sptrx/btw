import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Supabase session storage backed by the iOS Keychain / Android Keystore.
 * SecureStore values are limited to ~2 KB and a session is larger, so values are
 * split into chunks.
 */
const CHUNK = 1800;

async function getItem(key: string): Promise<string | null> {
  const count = Number(await SecureStore.getItemAsync(`${key}.n`));
  if (!count) return null;
  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`))
  );
  return parts.some((p) => p === null) ? null : parts.join('');
}

async function removeItem(key: string): Promise<void> {
  const count = Number(await SecureStore.getItemAsync(`${key}.n`)) || 0;
  await Promise.all([
    SecureStore.deleteItemAsync(`${key}.n`),
    ...Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)),
  ]);
}

async function setItem(key: string, value: string): Promise<void> {
  await removeItem(key);
  const parts = value.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, 'g')) ?? [''];
  await Promise.all(parts.map((p, i) => SecureStore.setItemAsync(`${key}.${i}`, p)));
  await SecureStore.setItemAsync(`${key}.n`, String(parts.length));
}

const webStorage = {
  getItem: async (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key: string, value: string) => globalThis.localStorage?.setItem(key, value),
  removeItem: async (key: string) => globalThis.localStorage?.removeItem(key),
};

export const sessionStorage = Platform.OS === 'web' ? webStorage : { getItem, setItem, removeItem };
