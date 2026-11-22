import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { getSupabaseAnonKeyServer, getSupabaseUrlServer } from "@/utils/supabase/public-env";

/**
 * Supabase client for server actions, route handlers and server components.
 *
 * Browsers authenticate with the session cookie. The mobile app has no cookie and
 * sends `Authorization: Bearer <access token>` instead; that client runs every query
 * under the same RLS as the user, and `auth.getUser()` validates the token with
 * Supabase Auth, so actions behave the same for both.
 */
export async function createClient(): Promise<SupabaseClient> {
  const bearer = bearerTokenFrom((await headers()).get("authorization"));
  if (bearer) return createBearerClient(bearer);

  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrlServer(),
    getSupabaseAnonKeyServer(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* read-only contexts (e.g. some Server Component renders) */
          }
        },
      },
    }
  );
}

export function bearerTokenFrom(header: string | null): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

function createBearerClient(accessToken: string): SupabaseClient {
  const client = createSupabaseClient(getSupabaseUrlServer(), getSupabaseAnonKeyServer(), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const getUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = (jwt?: string) => getUser(jwt ?? accessToken);
  return client;
}
