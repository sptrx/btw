import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKeyBrowser,
  getSupabaseUrlBrowser,
} from "@/utils/supabase/public-env";

export function createClient() {
  return createBrowserClient(getSupabaseUrlBrowser(), getSupabaseAnonKeyBrowser());
}

/** Client with implicit flow - use for password reset to avoid code_verifier/cookie issues */
export function createClientForPasswordReset() {
  return createBrowserClient(
    getSupabaseUrlBrowser(),
    getSupabaseAnonKeyBrowser(),
    { auth: { flowType: 'implicit' } }
  )
}