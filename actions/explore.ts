"use server";

import { createClient } from "@/utils/supabase/server";
import {
  approvedModerationOrFilter,
  isMissingModerationStatusColumn,
  isMissingSharingTypeColumn,
} from "@/lib/moderation";
import type { LandingFeedItem } from "@/actions/landing";

type ExploreRow = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  media_urls: unknown;
  created_at: string;
  topic_id: string;
  page_id: string | null;
  sharing_type?: string | null;
  likes: { count: number }[] | { count: number } | null;
};

function readEmbeddedCount(value: unknown): number {
  if (Array.isArray(value)) {
    const first = value[0] as { count?: unknown } | undefined;
    if (typeof first?.count === "number") return first.count;
  } else if (value && typeof value === "object") {
    const count = (value as { count?: unknown }).count;
    if (typeof count === "number") return count;
  }
  return 0;
}

function parseMediaUrls(raw: unknown): { url: string; type: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (m): m is { url: string; type: string } =>
      Boolean(m && typeof (m as { url?: string }).url === "string"),
  );
}

const FEED_TYPE_SET = new Set(["video", "podcast", "article", "discussion"]);

/**
 * Featured testimonies for the /explore outreach page — highest engagement first,
 * then newest. Falls back to recent testimony-tagged posts if sharing_type is missing.
 */
export async function getExploreTestimonies(limit = 3): Promise<LandingFeedItem[]> {
  const supabase = await createClient();
  const safeLimit = Math.min(Math.max(limit, 1), 6);

  const select =
    "id, type, title, body, media_urls, created_at, topic_id, page_id, sharing_type, " +
    "likes:topic_content_feedback(count)";

  const run = (withSharing: boolean, withModeration: boolean) => {
    let q = supabase
      .from("topic_content")
      .select(select)
      .eq("likes.type", "like");
    if (withSharing) q = q.eq("sharing_type", "testimony");
    if (withModeration) q = q.or(approvedModerationOrFilter());
    return q.order("created_at", { ascending: false }).limit(40);
  };

  let { data, error } = await run(true, true);
  if (error && isMissingSharingTypeColumn(error)) {
    ({ data, error } = await run(false, true));
  }
  if (error && isMissingModerationStatusColumn(error)) {
    ({ data, error } = await run(true, false));
    if (error && isMissingSharingTypeColumn(error)) {
      ({ data, error } = await run(false, false));
    }
  }

  if (error) {
    console.warn("[explore] getExploreTestimonies:", error.message);
    return [];
  }
  if (!data?.length) return [];

  const rows = data as unknown as ExploreRow[];
  const sorted = [...rows].sort((a, b) => {
    const la = readEmbeddedCount(a.likes);
    const lb = readEmbeddedCount(b.likes);
    if (lb !== la) return lb - la;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const top = sorted.slice(0, safeLimit);
  const topicIds = [...new Set(top.map((r) => r.topic_id))];
  const pageIds = [...new Set(top.map((r) => r.page_id).filter(Boolean))] as string[];

  const { data: topicRows } = await supabase
    .from("topics")
    .select("id, slug, title, cover_image_url")
    .in("id", topicIds);

  let pageRows: { id: string; slug: string; title: string }[] = [];
  if (pageIds.length) {
    const { data: p } = await supabase
      .from("channel_pages")
      .select("id, slug, title")
      .in("id", pageIds);
    pageRows = p ?? [];
  }

  const topicById = new Map((topicRows ?? []).map((t) => [t.id, t]));
  const pageById = new Map(pageRows.map((p) => [p.id, p]));

  const out: LandingFeedItem[] = [];
  for (const r of top) {
    const t = topicById.get(r.topic_id);
    if (!t) continue;
    const rawType = String(r.type);
    const type = FEED_TYPE_SET.has(rawType)
      ? (rawType as LandingFeedItem["type"])
      : "article";
    const page = r.page_id ? pageById.get(r.page_id) : undefined;
    const body = typeof r.body === "string" && r.body.trim() ? r.body.trim() : null;
    const bodySnippet =
      body && body.length > 220 ? `${body.slice(0, 217).trim()}…` : body;

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
      mediaItems: parseMediaUrls(r.media_urls),
      commentCount: 0,
      likeCount: readEmbeddedCount(r.likes),
      tags: [],
      isFeatured: false,
    });
  }

  return out;
}
