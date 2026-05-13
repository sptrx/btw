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
  commentCount: number;
  likeCount: number;
  tags: { id: string; slug: string; label: string }[];
  isFeatured: boolean;
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
 * Row shape returned by the homepage feed query. We narrow `data` to this type
 * locally because the PostgREST embed-count select string
 * (`comments:topic_content_comments(count), likes:topic_content_feedback(count)`)
 * isn't recognised by Supabase's generated typings and collapses the row union
 * to `GenericStringError`. The embedded count fields are intentionally permissive
 * — `readEmbeddedCount` handles both array and object shapes.
 */
type LandingFeedRow = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  media_urls: unknown;
  created_at: string;
  topic_id: string;
  page_id: string | null;
  is_featured?: boolean | null;
  comments: { count: number }[] | { count: number } | null;
  likes: { count: number }[] | { count: number } | null;
  tags?:
    | { tag: { id: string; slug: string; label: string } | null }[]
    | null;
};

/**
 * The `post_tags` / `topic_tags` migration may not have been applied yet in a
 * given environment; PostgREST then rejects the embed with 42P01 / PGRST.
 * In that case we silently re-query without the tag embed so the homepage
 * feed still renders.
 */
function isMissingPostTagsEmbed(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (!msg.includes("post_tags") && !msg.includes("topic_tags")) return false;
  if (code === "42P01" || code === "42703" || code.startsWith("PGRST")) return true;
  return (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find") ||
    msg.includes("could not embed")
  );
}

/**
 * The `is_featured` column ships in a separate migration
 * (`20260513010000_topic_content_is_featured.sql`). If an environment hasn't
 * run that migration yet, PostgREST returns 42703 / PGRST204 ("column not
 * found"). We detect that here so callers can fall back gracefully.
 */
function isMissingIsFeaturedColumn(
  err: { message?: string; code?: string } | null
): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (!msg.includes("is_featured")) return false;
  if (code === "42703" || code === "PGRST204" || code.startsWith("PGRST")) return true;
  return (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find")
  );
}

function readEmbeddedCount(value: unknown): number {
  if (Array.isArray(value)) {
    const first = value[0] as { count?: unknown } | undefined;
    if (first && typeof first.count === "number") return first.count;
  } else if (value && typeof value === "object") {
    const count = (value as { count?: unknown }).count;
    if (typeof count === "number") return count;
  }
  return 0;
}

/**
 * Map raw `topic_content` rows + the channel/page lookup tables into the public
 * `LandingFeedItem` shape used by both the homepage feed and the Featured strip.
 * Extracted so `getLandingFeed` and `getLandingFeatured` share one mapping path.
 */
function mapFeedRows(
  rows: LandingFeedRow[],
  topicById: Map<string, { slug: string; title: string; cover_image_url: string | null }>,
  pageById: Map<string, { slug: string; title: string }>
): LandingFeedItem[] {
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
    const commentCount = readEmbeddedCount((r as { comments?: unknown }).comments);
    const likeCount = readEmbeddedCount((r as { likes?: unknown }).likes);
    const tags = (r.tags ?? [])
      .map((row) => row.tag)
      .filter((tag): tag is { id: string; slug: string; label: string } => Boolean(tag));

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
      commentCount,
      likeCount,
      tags,
      isFeatured: Boolean(r.is_featured),
    });
  }
  return out;
}

/**
 * Resolve channels + pages for the given feed rows in two cheap `in (...)`
 * queries. Returns the lookup maps consumed by `mapFeedRows`.
 */
async function fetchFeedLookups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: LandingFeedRow[]
): Promise<{
  topicById: Map<string, { slug: string; title: string; cover_image_url: string | null }>;
  pageById: Map<string, { slug: string; title: string }>;
}> {
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
  return { topicById, pageById };
}

const FEED_BASE_SELECT =
  "id, type, title, body, media_urls, created_at, topic_id, page_id, " +
  "comments:topic_content_comments(count), " +
  "likes:topic_content_feedback(count)";
const FEED_FEATURED_FRAGMENT = ", is_featured";
const FEED_TAGS_EMBED = ", tags:post_tags(tag:topic_tags(id, slug, label))";

/**
 * Recent posts across all channels for the public home feed (newest first).
 *
 * Featured posts intentionally appear here too — the Featured strip is a
 * highlight, not a separate listing, so we do NOT exclude `is_featured = true`
 * rows from this query.
 */
export async function getLandingFeed(limit = 28): Promise<LandingFeedItem[]> {
  const supabase = await createClient();
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const run = (sel: string) =>
    supabase
      .from("topic_content")
      .select(sel)
      .eq("likes.type", "like")
      .order("created_at", { ascending: false })
      .limit(safeLimit);

  // Layered fallbacks: featured column → tags embed → bare select.
  let { data, error } = await run(FEED_BASE_SELECT + FEED_FEATURED_FRAGMENT + FEED_TAGS_EMBED);
  if (error && isMissingIsFeaturedColumn(error)) {
    ({ data, error } = await run(FEED_BASE_SELECT + FEED_TAGS_EMBED));
  }
  if (error && isMissingPostTagsEmbed(error)) {
    ({ data, error } = await run(FEED_BASE_SELECT + FEED_FEATURED_FRAGMENT));
    if (error && isMissingIsFeaturedColumn(error)) {
      ({ data, error } = await run(FEED_BASE_SELECT));
    }
  }

  if (error) {
    console.warn("[landing] getLandingFeed:", error.message);
    return [];
  }
  if (!data?.length) return [];

  const rows = data as unknown as LandingFeedRow[];
  const { topicById, pageById } = await fetchFeedLookups(supabase, rows);
  return mapFeedRows(rows, topicById, pageById);
}

/**
 * Posts flagged `is_featured = true`, capped at `limit` (max 4) and newest
 * first. Returns `[]` if the `is_featured` column hasn't been migrated yet,
 * which lets the homepage render gracefully on stale environments.
 */
export async function getLandingFeatured(limit = 4): Promise<LandingFeedItem[]> {
  const supabase = await createClient();
  const safeLimit = Math.min(Math.max(limit, 1), 4);

  const run = (sel: string) =>
    supabase
      .from("topic_content")
      .select(sel)
      .eq("is_featured", true)
      .eq("likes.type", "like")
      .order("created_at", { ascending: false })
      .limit(safeLimit);

  let { data, error } = await run(FEED_BASE_SELECT + FEED_FEATURED_FRAGMENT + FEED_TAGS_EMBED);
  if (error && isMissingPostTagsEmbed(error)) {
    ({ data, error } = await run(FEED_BASE_SELECT + FEED_FEATURED_FRAGMENT));
  }
  if (error && isMissingIsFeaturedColumn(error)) {
    return [];
  }

  if (error) {
    console.warn("[landing] getLandingFeatured:", error.message);
    return [];
  }
  if (!data?.length) return [];

  const rows = data as unknown as LandingFeedRow[];
  const { topicById, pageById } = await fetchFeedLookups(supabase, rows);
  return mapFeedRows(rows, topicById, pageById);
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
