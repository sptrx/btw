import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKeyServer, getSupabaseUrlServer } from "@/utils/supabase/public-env";

export async function createClient() {
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