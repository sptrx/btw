function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  return value;
}

export const config = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  /** The deployed website; the app's API lives at <apiUrl>/api/mobile. */
  apiUrl: (process.env.EXPO_PUBLIC_API_URL || 'https://believetheworks.org').replace(/\/+$/, ''),
  siteUrl: 'https://believetheworks.org',
};
