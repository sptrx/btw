"use server";

import { createClient } from "@/utils/supabase/server";

/** Card shape for `FeaturedChannelCarousel` (not used on the public home). */
export type LandingFeaturedCard = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  accent: string;
};

export type LandingIntroCopy = {
  headline: string;
  body: string;
};

/**
 * Intro copy for the public home from Supabase (`site_home_copy`).
 * Manage rows in the Dashboard (SQL editor / Table editor) or sync from a headless CMS.
 */
export async function getLandingHomeData(): Promise<{
  intro: LandingIntroCopy | null;
}> {
  const supabase = await createClient();

  let intro: LandingIntroCopy | null = null;
  const { data: copyRow, error: copyErr } = await supabase
    .from("site_home_copy")
    .select("intro_headline, intro_body")
    .eq("id", 1)
    .maybeSingle();

  if (copyErr) {
    console.warn("[landing] site_home_copy:", copyErr.message);
  } else if (copyRow?.intro_headline || copyRow?.intro_body) {
    intro = {
      headline: copyRow.intro_headline?.trim() || "",
      body: copyRow.intro_body?.trim() || "",
    };
  }

  return { intro };
}

/** Public home feed — mirrors `topic_content` + channel + optional page */
export type LandingFeedItem = {
  id: string;
  type: "video" | "podcast" | "article" | "discussion";
  title: string;
  bodySnippet: string | null;
  createdAt: string;
  channelSlug: string;
  channelTitle: string;
  channelCoverUrl: string | null;
  pageSlug: string | null;
  pageTitle: string | null;
  href: string;
  mediaItems: { url: string; type: string }[];
};

export type LandingChannelPill = {
  slug: string;
  title: string;
  coverImageUrl: string | null;
  description: string | null;
};

function parseMediaUrlsLanding(raw: unknown): { url: string; type: string }[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (m): m is { url: string; type: string } =>
        Boolean(
          m &&
            typeof (m as { url?: string }).url === "string" &&
            String((m as { url: string }).url).trim()
        )
    );
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (m): m is { url: string; type: string } =>
            Boolean(m && typeof (m as { url?: string }).url === "string")
        );
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

const FEED_TYPE_SET = new Set(["video", "podcast", "article", "discussion"]);

/**
 * Recent posts across all channels for the public home feed (newest first).
 */
export async function getLandingFeed(limit = 28): Promise<LandingFeedItem[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("topic_content")
    .select("id, type, title, body, media_urls, created_at, topic_id, page_id")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) {
    console.warn("[landing] getLandingFeed:", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const topicIds = [...new Set(rows.map((r) => r.topic_id))];
  const pageIds = [...new Set(rows.map((r) => r.page_id).filter(Boolean))] as string[];

  const { data: topicRows } = await supabase
    .from("topics")
    .select("id, slug, title, cover_image_url")
    .in("id", topicIds);

  let pageRows: { id: string; slug: string; title: string }[] = [];
  if (pageIds.length) {
    const { data: p } = await supabase.from("channel_pages").select("id, slug, title").in("id", pageIds);
    pageRows = p ?? [];
  }

  const topicById = new Map((topicRows ?? []).map((t) => [t.id, t]));
  const pageById = new Map(pageRows.map((p) => [p.id, p]));

  const out: LandingFeedItem[] = [];

  for (const r of rows) {
    const t = topicById.get(r.topic_id);
    if (!t) continue;
    const rawType = String(r.type);
    const type = FEED_TYPE_SET.has(rawType) ? (rawType as LandingFeedItem["type"]) : "article";
    const page = r.page_id ? pageById.get(r.page_id) : undefined;
    const body = typeof r.body === "string" && r.body.trim() ? r.body.trim() : null;
    const bodySnippet =
      body && body.length > 220 ? `${body.slice(0, 217).trim()}…` : body;
    const mediaItems = parseMediaUrlsLanding(r.media_urls);

    out.push({
      id: r.id,
      type,
      title: String(r.title ?? "").trim() || "Untitled",
      bodySnippet,
      createdAt: r.created_at,
      channelSlug: t.slug,
      channelTitle: t.title,
      channelCoverUrl: t.cover_image_url?.trim() || null,
      pageSlug: page?.slug ?? null,
      pageTitle: page?.title ?? null,
      href: `/channel/${t.slug}/content/${r.id}`,
      mediaItems,
    });
  }

  return out;
}

/**
 * Recently created channels for the home “discover” strip.
 */
export async function getLandingRecentChannels(limit = 14): Promise<LandingChannelPill[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("slug, title, cover_image_url, description")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 30));

  if (error) {
    console.warn("[landing] getLandingRecentChannels:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    slug: row.slug,
    title: row.title,
    coverImageUrl: row.cover_image_url?.trim() || null,
    description: row.description?.trim() || null,
  }));
}
