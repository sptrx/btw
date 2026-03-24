/**
 * Server / Edge: prefer SUPABASE_* (runtime on Cloudflare Worker) then NEXT_PUBLIC_*.
 * Browser: prefer window.__BTW_SUPABASE__ (injected in root layout from server) then NEXT_PUBLIC_*.
 *
 * NEXT_PUBLIC_* must exist at `next build` / `cf:build` time to be inlined into the client bundle.
 * If Workers Builds omit them, set SUPABASE_URL + SUPABASE_ANON_KEY on the Worker only — the layout
 * injects them for the browser so the client still works without a rebuild.
 */

declare global {
  interface Window {
    __BTW_SUPABASE__?: { url?: string; k?: string };
  }
}

export function getSupabaseUrlServer(): string {
  const v = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!v) {
    throw new Error(
      "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL. Cloudflare: Worker → Settings → Variables, or Workers Builds → Build variables (NEXT_PUBLIC_*), then redeploy."
    );
  }
  return v;
}

export function getSupabaseAnonKeyServer(): string {
  const v = process.env.SUPABASE_ANON_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!v) {
    throw new Error(
      "Missing SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY. Cloudflare: Worker → Settings → Variables, or Workers Builds → Build variables, then redeploy."
    );
  }
  return v;
}

export function getSupabaseUrlBrowser(): string {
  if (typeof window !== "undefined") {
    const u = window.__BTW_SUPABASE__?.url?.trim();
    if (u) return u;
  }
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!v) {
    throw new Error(
      "Missing Supabase URL. Set SUPABASE_URL on the Worker (recommended) or NEXT_PUBLIC_SUPABASE_URL in Workers Builds before cf:build. See docs/cloudflare-deploy.md."
    );
  }
  return v;
}

export function getSupabaseAnonKeyBrowser(): string {
  if (typeof window !== "undefined") {
    const k = window.__BTW_SUPABASE__?.k?.trim();
    if (k) return k;
  }
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!v) {
    throw new Error(
      "Missing Supabase anon key. Set SUPABASE_ANON_KEY on the Worker or NEXT_PUBLIC_SUPABASE_ANON_KEY at build time. See docs/cloudflare-deploy.md."
    );
  }
  return v;
}

/** Values read on the server for inline script (non-throwing). */
export function getSupabaseInlineConfig(): { url: string; k: string } | null {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const k = process.env.SUPABASE_ANON_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !k) return null;
  return { url, k };
}
