/**
 * NEXT_PUBLIC_* must be present when `next build` / `opennextjs-cloudflare build` runs,
 * or the values are inlined as empty and the browser throws from @supabase/ssr.
 *
 * Cloudflare: set the same keys in Workers Builds → Build variables (for the bundle)
 * and Worker → Variables (for server/middleware runtime), then rebuild.
 */
export function getSupabasePublicUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!v) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Set it before building: use .env.production locally, or Cloudflare Workers Builds → Build variables, then run cf:build again. Also set the same on the Worker for runtime (Settings → Variables)."
    );
  }
  return v;
}

export function getSupabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!v) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it before building: use .env.production locally, or Cloudflare Workers Builds → Build variables, then run cf:build again. Also set the same on the Worker for runtime (Settings → Variables)."
    );
  }
  return v;
}
