import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabasePublicUrl } from "@/utils/supabase/public-env";

export function createClient() {
  return createBrowserClient(getSupabasePublicUrl(), getSupabaseAnonKey());
}

/** Client with implicit flow - use for password reset to avoid code_verifier/cookie issues */
export function createClientForPasswordReset() {
  return createBrowserClient(
    getSupabasePublicUrl(),
    getSupabaseAnonKey(),
    { auth: { flowType: 'implicit' } }
  )
}