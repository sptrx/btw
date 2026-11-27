function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  return value;
}

/** Origin only — strips trailing slashes and an accidental `/api/mobile` suffix. */
function normalizeApiUrl(raw: string | undefined): string {
  let url = (raw || 'https://www.believetheworks.org').trim().replace(/\/+$/, '');
  url = url.replace(/\/api\/mobile$/i, '');
  return url.replace(/\/+$/, '');
}

export const config = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  /** Website origin; the app calls <apiUrl>/api/mobile/<action>. */
  apiUrl: normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL),
  siteUrl: 'https://www.believetheworks.org',
};
