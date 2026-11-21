import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrlServer } from "@/utils/supabase/public-env";

/**
 * Service-role client for the few writes users must not be able to make
 * themselves (moderation status, comments, Bible AI quota). Bypasses RLS —
 * only call it after the app has checked who the user is and run moderation.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY as a server-only secret (Cloudflare:
 * `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`). Never prefix it NEXT_PUBLIC_.
 */
export function createAdminClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    console.error("[supabase-admin] SUPABASE_SERVICE_ROLE_KEY is not set.");
    return null;
  }
  return createSupabaseClient(getSupabaseUrlServer(), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
