import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseAnonKeyServer, getSupabaseUrlServer } from "@/utils/supabase/public-env";

/**
 * Supabase client for server actions, route handlers and server components.
 *
 * Browsers authenticate with the session cookie. The mobile app has no cookie and
 * sends `Authorization: Bearer <access token>` instead. That client runs every
 * query under the same RLS as the user. `auth.getUser()` is called with the JWT so
 * actions see the signed-in user without importing `@supabase/supabase-js` here
 * (that import breaks the "use server" webpack graph for `getCurrentUser`).
 */
export async function createClient() {
  const accessToken = bearerTokenFrom((await headers()).get("authorization"));
  if (accessToken) return createBearerClient(accessToken);

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrlServer(), getSupabaseAnonKeyServer(), {
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
  });
}

export function bearerTokenFrom(header: string | null): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

function createBearerClient(accessToken: string) {
  const client = createServerClient(getSupabaseUrlServer(), getSupabaseAnonKeyServer(), {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* mobile Bearer clients have no cookie jar to write */
      },
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });

  // Cookie session is empty; pass the JWT so auth.getUser() validates the mobile token.
  const getUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = ((jwt?: string) => getUser(jwt ?? accessToken)) as typeof client.auth.getUser;
  return client;
}
