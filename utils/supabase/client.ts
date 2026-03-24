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
 * Password reset must use implicit flow (tokens in URL hash) so the email link works when opened
 * from another app/browser. `@supabase/ssr`’s `createBrowserClient` always forces `flowType: "pkce"`
 * and uses a singleton, so it ignores `flowType: "implicit"` and can reuse the app’s PKCE client —
 * which produces `?code=` links that fail with “same browser” when the verifier isn’t present.
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