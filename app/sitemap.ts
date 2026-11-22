import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKeyServer, getSupabaseUrlServer } from "@/utils/supabase/public-env";
import { siteUrl } from "@/lib/site-url";

// Built per request: content changes constantly and the Worker has no build-time database access.
export const dynamic = "force-dynamic";

const MAX_POSTS = 5000;

const STATIC_PATHS = [
  "/",
  "/explore",
  "/ask",
  "/about",
  "/invite",
  "/contact",
  "/donate",
  "/map",
  "/feed",
  "/channel",
  "/prayer",
  "/legal/terms",
  "/legal/community-guidelines",
  "/legal/content-disclaimer",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" || path === "/feed" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));

  try {
    // Anonymous client: row-level security returns only what the public can see
    // (approved posts), so hidden content never reaches the sitemap.
    const supabase = createClient(getSupabaseUrlServer(), getSupabaseAnonKeyServer(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: channels } = await supabase.from("topics").select("id, slug, created_at").is("archived_at", null);
    const slugById = new Map<string, string>();
    for (const c of channels ?? []) {
      if (!c.slug) continue;
      slugById.set(c.id as string, c.slug as string);
      entries.push({
        url: `${base}/channel/${encodeURIComponent(c.slug as string)}`,
        lastModified: c.created_at ? new Date(c.created_at as string) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    const { data: posts } = await supabase
      .from("topic_content")
      .select("id, topic_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(MAX_POSTS);
    for (const p of posts ?? []) {
      const slug = slugById.get(p.topic_id as string);
      if (!slug) continue;
      const modified = (p.updated_at ?? p.created_at) as string | null;
      entries.push({
        url: `${base}/channel/${encodeURIComponent(slug)}/content/${p.id}`,
        lastModified: modified ? new Date(modified) : undefined,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch (e) {
    // Still serve the static pages if the database is unreachable.
    console.error("[sitemap]", e);
  }

  return entries;
}
