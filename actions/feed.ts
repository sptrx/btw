"use server";

import { createClient } from "@/utils/supabase/server";
import { approvedModerationOrFilter, isMissingModerationStatusColumn } from "@/lib/moderation";
import type { ReactionCounts } from "@/lib/post-reactions";
import { emptyReactionCounts } from "@/lib/post-reactions";
import { getPostReactions, type PostReactionKey } from "@/actions/reactions";
import { ANONYMOUS_LABEL } from "@/lib/prayer-display";
import {
  isSharingType,
  sharingTypeLabel,
  type SharingFeedFilter,
  type SharingType,
} from "@/lib/sharing-types";
import { isMissingSharingTypeColumn } from "@/lib/moderation";
import { getFollowedUserIds } from "@/actions/follows";
import { isMissingGeoColumn } from "@/lib/geo/resolve-content-country";
import { readingMinutes } from "@/lib/post-card";
import { streamCustomerCode, streamPlayerUrl, streamThumbnailUrl } from "@/lib/stream-urls";
import { shortsInFeedFilter } from "@/lib/shorts-types";

export type CommunityFeedFilter = SharingFeedFilter;

export type CommunityFeedBadge = string;

export type CommunityFeedItem = {
  id: string;
  postKind: "topic_content" | "prayer_request" | "praise_report" | "short";
  badge: CommunityFeedBadge;
  title: string;
  bodySnippet: string | null;
  readMinutes: number | null;
  createdAt: string;
  href: string;
  fromFollowed: boolean;
  /** Channel content only */
  channelSlug?: string;
  channelTitle?: string;
  channelCoverUrl?: string | null;
  pageSlug?: string | null;
  pageTitle?: string | null;
  contentType?: "video" | "podcast" | "article" | "discussion";
  sharingType?: SharingType | string;
  scriptureReference?: string | null;
  mediaItems?: { url: string; type: string }[];
  commentCount?: number;
  /** Shorts only — Stream player and poster, built on the server. */
  playerUrl?: string | null;
  posterUrl?: string | null;
  durationSeconds?: number | null;
  /** Prayer request */
  prayerCount?: number;
  authorLabel?: string | null;
  authorId?: string;
  authorUsername?: string | null;
  viewerFollowsAuthor?: boolean;
  tags?: { id: string; slug: string; label: string }[];
  reactions: ReactionCounts;
  userReaction: import("@/lib/post-reactions").PostReactionType | null;
};

export type CommunityFeedCursor = {
  createdAt: string;
  id: string;
  postKind: CommunityFeedItem["postKind"];
};

export type CommunityFeedPage = {
  items: CommunityFeedItem[];
  nextCursor: CommunityFeedCursor | null;
};

const TESTIMONY_TAG_SLUG = "testimonies";
const REVELATION_TAG_SLUG = "revelation";

function parseMediaUrls(raw: unknown): { url: string; type: string }[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (m): m is { url: string; type: string } =>
        Boolean(m && typeof (m as { url?: string }).url === "string")
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

function snippet(text: string | null | undefined, max = 220): string | null {
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t;
}

function resolveSharingType(
  sharingType: string | null | undefined,
  mediaType: string,
  tagSlugs: string[]
): SharingType {
  if (sharingType && isSharingType(sharingType)) return sharingType;
  if (tagSlugs.includes(REVELATION_TAG_SLUG)) return "revelation";
  if (tagSlugs.includes(TESTIMONY_TAG_SLUG)) return "testimony";
  if (mediaType === "discussion") return "discussion";
  return "testimony";
}

function badgeForItem(
  sharing: SharingType,
  mediaType: string
): CommunityFeedBadge {
  if (sharing !== "testimony" && sharing !== "discussion") {
    return sharingTypeLabel(sharing);
  }
  switch (mediaType) {
    case "video":
      return "Video";
    case "podcast":
      return "Podcast";
    case "discussion":
      return "Discussion";
    default:
      return sharingTypeLabel(sharing);
  }
}

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

async function getFollowedTopicIds(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_members")
    .select("topic_id")
    .eq("user_id", userId)
    .eq("status", "approved");
  return new Set((data ?? []).map((r) => r.topic_id));
}

async function getTagIdsBySlugs(slugs: string[]): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.from("topic_tags").select("id, slug").in("slug", slugs);
  return new Map((data ?? []).map((t) => [t.slug, t.id]));
}

async function getContentIdsWithTag(tagId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("post_tags").select("topic_content_id").eq("tag_id", tagId);
  return new Set((data ?? []).map((r) => r.topic_content_id));
}

type RawContentRow = {
  id: string;
  type: string;
  sharing_type?: string | null;
  scripture_reference?: string | null;
  title: string | null;
  body: string | null;
  media_urls: unknown;
  created_at: string;
  topic_id: string;
  page_id: string | null;
  author_id?: string;
  country_code?: string | null;
  comments?: unknown;
  tags?: { tag: { id: string; slug: string; label: string } | null }[] | null;
};

async function fetchTopicContentSlice(
  filter: CommunityFeedFilter,
  limit: number,
  cursor: CommunityFeedCursor | null,
  testimonyContentIds: Set<string> | null,
  revelationContentIds: Set<string> | null,
  followedAuthorIds: string[] | null
): Promise<RawContentRow[]> {
  if (filter === "prayer") return [];
  if (filter === "following" && (!followedAuthorIds || followedAuthorIds.length === 0)) {
    return [];
  }

  const useTagFallback =
    filter === "testimonies" || filter === "revelations";

  const tagFilteredIds =
    filter === "testimonies" && testimonyContentIds
      ? [...testimonyContentIds]
      : filter === "revelations" && revelationContentIds
        ? [...revelationContentIds]
        : null;

  if (useTagFallback && tagFilteredIds && tagFilteredIds.length === 0) return [];

  const supabase = await createClient();
  const select =
    "id, type, sharing_type, scripture_reference, title, body, media_urls, created_at, topic_id, page_id, author_id, country_code, " +
    "comments:topic_content_comments(count), tags:post_tags(tag:topic_tags(id, slug, label))";

  const run = (withModeration: boolean, withSharingCol: boolean, withGeo: boolean) => {
    const cols = withSharingCol
      ? withGeo
        ? select
        : "id, type, sharing_type, scripture_reference, title, body, media_urls, created_at, topic_id, page_id, author_id, " +
          "comments:topic_content_comments(count), tags:post_tags(tag:topic_tags(id, slug, label))"
      : "id, type, title, body, media_urls, created_at, topic_id, page_id, author_id, " +
        "comments:topic_content_comments(count), tags:post_tags(tag:topic_tags(id, slug, label))";
    let q = supabase.from("topic_content").select(cols);
    if (withModeration) q = q.or(approvedModerationOrFilter());
    if (followedAuthorIds?.length) {
      q = q.in("author_id", followedAuthorIds);
    }

    if (filter === "discussions") {
      q = withSharingCol
        ? q.or("sharing_type.eq.discussion,type.eq.discussion")
        : q.eq("type", "discussion");
    }
    if (filter === "videos") q = q.in("type", ["video", "podcast"]);
    if (filter === "questions" && withSharingCol) q = q.eq("sharing_type", "question");
    if (filter === "devotionals" && withSharingCol) q = q.eq("sharing_type", "devotional");
    if (filter === "praise" && withSharingCol) q = q.eq("sharing_type", "praise_report");
    if (filter === "prophecies" && withSharingCol) q = q.eq("sharing_type", "prophecy");
    if (filter === "testimonies" && withSharingCol) {
      q = q.eq("sharing_type", "testimony");
    } else if (filter === "revelations" && withSharingCol) {
      q = q.eq("sharing_type", "revelation");
    } else if (useTagFallback && tagFilteredIds) {
      q = q.in("id", tagFilteredIds.slice(0, 500));
    }

    if (cursor?.postKind === "topic_content") {
      q = q.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
      );
    } else if (cursor && !tagFilteredIds) {
      q = q.lt("created_at", cursor.createdAt);
    }

    return q.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
  };

  let { data, error } = await run(true, true, true);
  if (error && isMissingGeoColumn(error)) {
    ({ data, error } = await run(true, true, false));
  }
  if (error && isMissingSharingTypeColumn(error)) {
    ({ data, error } = await run(true, false, false));
  }
  if (error && isMissingModerationStatusColumn(error)) {
    ({ data, error } = await run(false, false, false));
  }
  if (error) {
    const fallback = await supabase
      .from("topic_content")
      .select(
        "id, type, title, body, media_urls, created_at, topic_id, page_id, comments:topic_content_comments(count)"
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    data = fallback.data as typeof data;
    error = fallback.error;
  }
  if (error) {
    console.warn("[feed] topic_content:", error.message);
    return [];
  }

  return (data ?? []) as unknown as RawContentRow[];
}

type PrayerFeedRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  country_code?: string | null;
};

async function fetchPrayerSlice(
  filter: CommunityFeedFilter,
  limit: number,
  cursor: CommunityFeedCursor | null,
  followedAuthorIds: string[] | null
): Promise<PrayerFeedRow[]> {
  if (filter !== "all" && filter !== "prayer" && filter !== "following") return [];
  if (filter === "following" && (!followedAuthorIds || followedAuthorIds.length === 0)) {
    return [];
  }

  const supabase = await createClient();

  const run = (withGeo: boolean) => {
    let q = supabase
      .from("prayer_request")
      .select(
        withGeo
          ? "id, user_id, title, body, is_anonymous, status, created_at, country_code"
          : "id, user_id, title, body, is_anonymous, status, created_at"
      )
      .in("status", ["active", "answered"])
      .or(approvedModerationOrFilter("moderation_status"))
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (followedAuthorIds?.length) {
      q = q.in("user_id", followedAuthorIds);
    }

    if (cursor?.postKind === "prayer_request") {
      q = q.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
      );
    } else if (cursor) {
      q = q.lt("created_at", cursor.createdAt);
    }
    return q;
  };

  let { data, error } = await run(true);
  if (error && isMissingGeoColumn(error)) {
    ({ data, error } = await run(false));
  }
  if (error) {
    console.warn("[feed] prayer_request:", error.message);
    return [];
  }
  return (data ?? []) as unknown as PrayerFeedRow[];
}

async function fetchPraiseSlice(
  filter: CommunityFeedFilter,
  limit: number,
  cursor: CommunityFeedCursor | null,
  followedAuthorIds: string[] | null
) {
  if (
    filter !== "all" &&
    filter !== "testimonies" &&
    filter !== "praise" &&
    filter !== "following"
  ) {
    return [];
  }
  if (filter === "following" && (!followedAuthorIds || followedAuthorIds.length === 0)) {
    return [];
  }

  const supabase = await createClient();
  let q = supabase
    .from("praise_report")
    .select("id, user_id, body, prayer_request_id, created_at")
    .or(approvedModerationOrFilter("moderation_status"))
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (followedAuthorIds?.length) {
    q = q.in("user_id", followedAuthorIds);
  }

  if (cursor?.postKind === "praise_report") {
    q = q.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    );
  } else if (cursor) {
    q = q.lt("created_at", cursor.createdAt);
  }

  const { data, error } = await q;
  if (error) {
    console.warn("[feed] praise_report:", error.message);
    return [];
  }
  return data ?? [];
}

type ShortFeedRow = {
  id: string;
  author_id: string;
  caption: string;
  stream_uid: string | null;
  duration_seconds: number | null;
  created_at: string;
};

/** Approved shorts belong in the same feed as everything else. */
async function fetchShortsSlice(
  filter: CommunityFeedFilter,
  limit: number,
  cursor: CommunityFeedCursor | null,
  followedAuthorIds: string[] | null
): Promise<ShortFeedRow[]> {
  if (!shortsInFeedFilter(filter)) return [];
  if (filter === "following" && (!followedAuthorIds || followedAuthorIds.length === 0)) {
    return [];
  }

  const supabase = await createClient();
  let q = supabase
    .from("shorts")
    .select("id, author_id, caption, stream_uid, duration_seconds, created_at")
    .eq("status", "approved")
    .not("stream_uid", "is", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (followedAuthorIds?.length) q = q.in("author_id", followedAuthorIds);

  if (cursor?.postKind === "short") {
    q = q.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    );
  } else if (cursor) {
    q = q.lt("created_at", cursor.createdAt);
  }

  const { data, error } = await q;
  if (error) {
    // The table or its columns may not exist yet on an older database.
    console.warn("[feed] shorts:", error.message);
    return [];
  }
  return (data ?? []) as ShortFeedRow[];
}

function sortFeedItems(items: CommunityFeedItem[]): CommunityFeedItem[] {
  return [...items].sort((a, b) => {
    if (a.fromFollowed !== b.fromFollowed) return a.fromFollowed ? -1 : 1;
    const t = b.createdAt.localeCompare(a.createdAt);
    if (t !== 0) return t;
    return b.id.localeCompare(a.id);
  });
}

function cursorBefore(
  item: CommunityFeedItem,
  cursor: CommunityFeedCursor | null
): boolean {
  if (!cursor) return true;
  if (item.createdAt < cursor.createdAt) return true;
  if (item.createdAt > cursor.createdAt) return false;
  if (item.id < cursor.id) return true;
  if (item.id > cursor.id) return false;
  return item.postKind < cursor.postKind;
}

/**
 * Personalized ranking for the mobile "For you" tab.
 * Heuristic (no cloud ML model): boost followed authors, types the viewer
 * reacts to / saves, and fresher posts — then blend so the feed stays diverse.
 */
async function preferenceBoosts(userId: string | null): Promise<{
  preferredTypes: Set<string>;
}> {
  if (!userId) return { preferredTypes: new Set() };
  const supabase = await createClient();
  const since = new Date(Date.now() - 45 * 86_400_000).toISOString();
  const [{ data: reactions }, { data: saved }] = await Promise.all([
    supabase
      .from("post_reaction")
      .select("post_id, post_kind")
      .eq("user_id", userId)
      .gte("created_at", since)
      .limit(80),
    supabase
      .from("saved_content")
      .select("topic_content_id")
      .eq("user_id", userId)
      .limit(40),
  ]);

  const contentIds = [
    ...new Set([
      ...(reactions ?? [])
        .filter((r) => r.post_kind === "topic_content")
        .map((r) => r.post_id),
      ...(saved ?? []).map((r) => r.topic_content_id),
    ]),
  ].slice(0, 60);

  if (contentIds.length === 0) return { preferredTypes: new Set() };

  const { data: rows } = await supabase
    .from("topic_content")
    .select("sharing_type, type")
    .in("id", contentIds);

  const preferredTypes = new Set<string>();
  for (const row of rows ?? []) {
    if (row.sharing_type) preferredTypes.add(String(row.sharing_type));
    if (row.type) preferredTypes.add(String(row.type));
  }
  return { preferredTypes };
}

function scoreForYouItem(
  item: CommunityFeedItem,
  preferredTypes: Set<string>,
  now: number
): number {
  let score = 0;
  if (item.fromFollowed || item.viewerFollowsAuthor) score += 40;
  if (item.sharingType && preferredTypes.has(String(item.sharingType))) score += 25;
  if (item.contentType && preferredTypes.has(item.contentType)) score += 12;
  const ageHours = Math.max(0, (now - new Date(item.createdAt).getTime()) / 3_600_000);
  score += Math.max(0, 30 - ageHours); // fresher posts rank higher
  const reactionTotal = Object.values(item.reactions).reduce((a, b) => a + b, 0);
  score += Math.min(20, reactionTotal * 2);
  score += Math.min(10, item.commentCount ?? 0);
  return score;
}

export async function getCommunityFeedPage(
  filter: CommunityFeedFilter = "all",
  limit = 20,
  cursor: CommunityFeedCursor | null = null
): Promise<CommunityFeedPage> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const followedTopicIds = await getFollowedTopicIds(user?.id ?? null);
  const followedUserIds = await getFollowedUserIds(user?.id ?? null);

  // "for_you" fetches the broad pool and ranks it. A category chip passes that category as `filter`.
  // Callers that want a category under For you should pass that category as `filter` and
  // set options.forYou — mobile API does that via getForYouFeedPage.
  const contentFilter: CommunityFeedFilter = filter === "for_you" ? "all" : filter;

  const followedAuthorIds =
    contentFilter === "following" ? [...followedUserIds] : null;

  const safeLimit = Math.min(Math.max(limit, 1), 30);
  const fetchLimit = filter === "for_you" ? safeLimit * 5 : safeLimit * 3;

  const tagMap = await getTagIdsBySlugs([TESTIMONY_TAG_SLUG, REVELATION_TAG_SLUG]);
  const testimonyTagId = tagMap.get(TESTIMONY_TAG_SLUG);
  const revelationTagId = tagMap.get(REVELATION_TAG_SLUG);

  const [testimonyContentIds, revelationContentIds, boosts] = await Promise.all([
    contentFilter === "testimonies" || contentFilter === "all" || filter === "for_you"
      ? testimonyTagId
        ? getContentIdsWithTag(testimonyTagId)
        : Promise.resolve(new Set<string>())
      : Promise.resolve(null),
    contentFilter === "revelations" || contentFilter === "all" || filter === "for_you"
      ? revelationTagId
        ? getContentIdsWithTag(revelationTagId)
        : Promise.resolve(new Set<string>())
      : Promise.resolve(null),
    filter === "for_you" ? preferenceBoosts(user?.id ?? null) : Promise.resolve({ preferredTypes: new Set<string>() }),
  ]);

  const [contentRows, prayerRows, praiseRows, shortRows] = await Promise.all([
    fetchTopicContentSlice(
      contentFilter,
      fetchLimit,
      cursor,
      contentFilter === "testimonies" ? testimonyContentIds : null,
      contentFilter === "revelations" ? revelationContentIds : null,
      followedAuthorIds
    ),
    fetchPrayerSlice(contentFilter, fetchLimit, cursor, followedAuthorIds),
    fetchPraiseSlice(contentFilter, fetchLimit, cursor, followedAuthorIds),
    fetchShortsSlice(contentFilter, fetchLimit, cursor, followedAuthorIds),
  ]);

  const topicIds = [...new Set(contentRows.map((r) => r.topic_id))];
  const pageIds = [...new Set(contentRows.map((r) => r.page_id).filter(Boolean))] as string[];

  const [{ data: topicRows }, pageResult, { data: profileRows }] = await Promise.all([
    topicIds.length
      ? supabase.from("topics").select("id, slug, title, cover_image_url").is("archived_at", null).in("id", topicIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string; cover_image_url: string | null }[] }),
    pageIds.length
      ? supabase.from("channel_pages").select("id, slug, title").in("id", pageIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
    (() => {
      const userIds = [
        ...new Set([
          ...contentRows.map((r) => r.author_id).filter((id): id is string => Boolean(id)),
          ...prayerRows.map((r) => r.user_id),
          ...praiseRows.map((r) => r.user_id),
          ...shortRows.map((r) => r.author_id),
        ]),
      ];
      if (!userIds.length) {
        return Promise.resolve({
          data: [] as { id: string; display_name: string | null; username: string | null }[],
        });
      }
      return supabase.from("profiles").select("id, display_name, username").in("id", userIds);
    })(),
  ]);

  const topicById = new Map((topicRows ?? []).map((t) => [t.id, t]));
  const pageById = new Map((pageResult.data ?? []).map((p) => [p.id, p]));
  const profileById = new Map((profileRows ?? []).map((p) => [p.id, p]));

  const items: CommunityFeedItem[] = [];

  for (const r of contentRows) {
    const topic = topicById.get(r.topic_id);
    if (!topic) continue;

    const tags = (r.tags ?? [])
      .map((row) => row.tag)
      .filter((tag): tag is { id: string; slug: string; label: string } => Boolean(tag));

    const tagSlugs = tags.map((t) => t.slug);
    const sharing = resolveSharingType(r.sharing_type, r.type, tagSlugs);
    const badge = badgeForItem(sharing, r.type);

    if (filter === "testimonies" && sharing !== "testimony") continue;
    if (filter === "revelations" && sharing !== "revelation") continue;
    if (filter === "prophecies" && sharing !== "prophecy") continue;
    if (filter === "questions" && sharing !== "question") continue;
    if (filter === "devotionals" && sharing !== "devotional") continue;
    if (filter === "praise" && sharing !== "praise_report") continue;
    if (filter === "discussions" && sharing !== "discussion" && r.type !== "discussion")
      continue;

    const page = r.page_id ? pageById.get(r.page_id) : undefined;
    const rawType = String(r.type);
    const contentType =
      rawType === "video" || rawType === "podcast" || rawType === "discussion"
        ? rawType
        : rawType === "article"
          ? "article"
          : "article";

    const authorId = r.author_id;
    const authorProfile = authorId ? profileById.get(authorId) : undefined;

    items.push({
      id: r.id,
      postKind: "topic_content",
      badge,
      title: String(r.title ?? "").trim() || "Untitled",
      bodySnippet: snippet(r.body),
      readMinutes: readingMinutes(r.body),
      createdAt: r.created_at,
      href: `/channel/${topic.slug}/content/${r.id}`,
      fromFollowed: followedTopicIds.has(r.topic_id),
      authorId,
      authorUsername: authorProfile?.username ?? null,
      authorLabel: authorProfile?.display_name?.trim() || undefined,
      viewerFollowsAuthor: authorId ? followedUserIds.has(authorId) : false,
      channelSlug: topic.slug,
      channelTitle: topic.title,
      channelCoverUrl: topic.cover_image_url?.trim() || null,
      pageSlug: page?.slug ?? null,
      pageTitle: page?.title ?? null,
      contentType,
      sharingType: sharing,
      scriptureReference: r.scripture_reference?.trim() || null,
      mediaItems: parseMediaUrls(r.media_urls),
      commentCount: readEmbeddedCount(r.comments),
      tags,
      reactions: emptyReactionCounts(),
      userReaction: null,
    });
  }

  const viewerId = user?.id ?? null;
  for (const r of prayerRows) {
    const profile = profileById.get(r.user_id);
    const anonymous = r.is_anonymous && viewerId !== r.user_id;
    items.push({
      id: r.id,
      postKind: "prayer_request",
      badge: "Prayer request",
      sharingType: "prayer_request",
      title: r.title,
      bodySnippet: snippet(r.body),
      readMinutes: readingMinutes(r.body),
      createdAt: r.created_at,
      href: `/prayer/${r.id}`,
      fromFollowed: followedUserIds.has(r.user_id),
      authorId: anonymous ? undefined : r.user_id,
      authorUsername: anonymous ? null : profile?.username ?? null,
      authorLabel: anonymous
        ? ANONYMOUS_LABEL
        : profile?.display_name?.trim() || "Community member",
      viewerFollowsAuthor: anonymous ? false : followedUserIds.has(r.user_id),
      reactions: emptyReactionCounts(),
      userReaction: null,
    });
  }

  for (const r of praiseRows) {
    const profile = profileById.get(r.user_id);
    const title =
      r.body.trim().length > 80 ? `${r.body.trim().slice(0, 77)}…` : r.body.trim() || "Praise report";
    items.push({
      id: r.id,
      postKind: "praise_report",
      badge: "Praise Report",
      sharingType: "praise_report",
      title,
      bodySnippet: snippet(r.body, 280),
      readMinutes: readingMinutes(r.body),
      createdAt: r.created_at,
      href: "/prayer",
      fromFollowed: followedUserIds.has(r.user_id),
      authorId: r.user_id,
      authorUsername: profile?.username ?? null,
      authorLabel: profile?.display_name?.trim() || "Community member",
      viewerFollowsAuthor: followedUserIds.has(r.user_id),
      reactions: emptyReactionCounts(),
      userReaction: null,
    });
  }

  const streamCode = streamCustomerCode();
  for (const r of shortRows) {
    const profile = profileById.get(r.author_id);
    const caption = r.caption.trim();
    const title = caption.length > 80 ? `${caption.slice(0, 77)}…` : caption || "A short";
    items.push({
      id: r.id,
      postKind: "short",
      badge: "Short",
      sharingType: "short",
      title,
      bodySnippet: caption.length > 80 ? snippet(caption, 280) : null,
      readMinutes: null,
      createdAt: r.created_at,
      href: `/shorts/${r.id}`,
      fromFollowed: followedUserIds.has(r.author_id),
      contentType: "video",
      durationSeconds: r.duration_seconds,
      playerUrl: r.stream_uid ? streamPlayerUrl(r.stream_uid, streamCode) : null,
      posterUrl: r.stream_uid ? streamThumbnailUrl(r.stream_uid, streamCode) : null,
      authorId: r.author_id,
      authorUsername: profile?.username ?? null,
      authorLabel: profile?.display_name?.trim() || "Community member",
      viewerFollowsAuthor: followedUserIds.has(r.author_id),
      reactions: emptyReactionCounts(),
      userReaction: null,
    });
  }

  const candidate = sortFeedItems(items).filter((item) => cursorBefore(item, cursor));

  // Load reactions before ranking so engagement can influence "For you".
  const reactionKeys: PostReactionKey[] = candidate.map((i) => ({
    postId: i.id,
    postKind: i.postKind,
  }));
  const reactions = await getPostReactions(reactionKeys);
  for (const item of candidate) {
    const state = reactions.get(`${item.postKind}:${item.id}`);
    if (state) {
      item.reactions = state.counts;
      item.userReaction = state.userReaction;
    }
  }

  const ranked =
    filter === "for_you"
      ? [...candidate].sort((a, b) => {
          const now = Date.now();
          const diff =
            scoreForYouItem(b, boosts.preferredTypes, now) -
            scoreForYouItem(a, boosts.preferredTypes, now);
          if (diff !== 0) return diff;
          return b.createdAt.localeCompare(a.createdAt);
        })
      : candidate;

  const pageItems = ranked.slice(0, safeLimit);
  const hasMore = ranked.length > safeLimit;

  const last = pageItems[pageItems.length - 1];
  const nextCursor: CommunityFeedCursor | null =
    hasMore && last
      ? { createdAt: last.createdAt, id: last.id, postKind: last.postKind }
      : null;

  return { items: pageItems, nextCursor };
}

/** For you tab with an optional category chip (testimonies, prophecies, …). */
export async function getForYouFeedPage(
  category: CommunityFeedFilter = "all",
  limit = 20,
  cursor: CommunityFeedCursor | null = null
): Promise<CommunityFeedPage> {
  const categoryFilter =
    category === "following" || category === "for_you" ? "all" : category;
  if (categoryFilter === "all") {
    return getCommunityFeedPage("for_you", limit, cursor);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const page = await getCommunityFeedPage(categoryFilter, Math.min(limit * 3, 30), cursor);
  const boosts = await preferenceBoosts(user?.id ?? null);
  const now = Date.now();
  const ranked = [...page.items].sort(
    (a, b) =>
      scoreForYouItem(b, boosts.preferredTypes, now) -
      scoreForYouItem(a, boosts.preferredTypes, now)
  );
  return {
    items: ranked.slice(0, limit),
    nextCursor: page.nextCursor,
  };
}
