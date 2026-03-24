import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKeyBrowser,
  getSupabaseUrlBrowser,
} from "@/utils/supabase/public-env";

export function createClient() {
  return createBrowserClient(getSupabaseUrlBrowser(), getSupabaseAnonKeyBrowser());
}

/**
 * Email links (password reset + signup confirmation) must use implicit flow (tokens in URL hash) so
 * links work when opened from mail or another browser. `@supabase/ssr`’s `createBrowserClient` forces
 * `flowType: "pkce"` and a singleton, which yields `?code=` links that fail without a code verifier.
 */
export function createImplicitRecoveryClient() {
  return createSupabaseJsClient(getSupabaseUrlBrowser(), getSupabaseAnonKeyBrowser(), {
    auth: {
      flowType: "implicit",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });
}