"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Single row of the "Recent comments on your content" feed on the dashboard.
 * The shape is intentionally flat: all the values the UI needs to render a row
 * (commenter label/initial, snippet, target post link) without further lookups.
 */
export type RecentCommentRow = {
  id: string;
  commenterId: string;
  commenterName: string;
  snippet: string;
  createdAt: string;
  postId: string;
  postTitle: string;
  channelSlug: string;
};

/**
 * Aggregated data for the signed-in user dashboard.
 *
 * Counts are absolute (not capped). `recentComments` is the 10 newest comments
 * on any post in any channel the user owns. Empty arrays / zero counts mean
 * the user has not yet produced any of that thing — render them as `0` rather
 * than hiding the tile.
 */
export type DashboardOverview = {
  channelCount: number;
  postCount: number;
  commentsReceivedCount: number;
  recentComments: RecentCommentRow[];
};

const RECENT_COMMENTS_LIMIT = 10;
const SNIPPET_MAX_LENGTH = 140;

function makeSnippet(body: string | null | undefined): string {
  const trimmed = (body ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  if (trimmed.length <= SNIPPET_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, SNIPPET_MAX_LENGTH - 1).trimEnd()}…`;
}

/**
 * Fetch the dashboard overview for a given user.
 *
 * Strategy:
 *  1. Load the user's channels (id + slug). `channelCount` is the array
 *     length — no extra round trip just to count.
 *  2. If they own channels, load slim post rows (id, title, topic_id) so we
 *     have both the post count and the lookup needed to render recent
 *     comments without further joins. `postCount` is the array length.
 *  3. In parallel: count comments across those posts (HEAD count query) and
 *     pull the 10 newest comments. The `topic_content_comments` table has
 *     no FK to `profiles` (only to `auth.users`), so commenter display
 *     names are fetched in a single batched `.in("id", ...)` query.
 *
 * All three counts are returned as `0` when the upstream data is empty so
 * the UI can short-circuit on `channelCount === 0` without special casing
 * undefined.
 */
export async function getDashboardOverview(
  userId: string
): Promise<DashboardOverview> {
  const supabase = await createClient();

  const { data: channelRows, error: channelsErr } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("author_id", userId);

  if (channelsErr) {
    console.warn("[dashboard] topics:", channelsErr.message);
    return {
      channelCount: 0,
      postCount: 0,
      commentsReceivedCount: 0,
      recentComments: [],
    };
  }

  const channels = channelRows ?? [];
  const channelCount = channels.length;
  if (channelCount === 0) {
    return {
      channelCount: 0,
      postCount: 0,
      commentsReceivedCount: 0,
      recentComments: [],
    };
  }

  const channelIds = channels.map((c) => c.id);
  const channelSlugById = new Map(channels.map((c) => [c.id, c.slug]));

  const { data: postRows, error: postsErr } = await supabase
    .from("topic_content")
    .select("id, title, topic_id")
    .in("topic_id", channelIds);

  if (postsErr) {
    console.warn("[dashboard] topic_content:", postsErr.message);
    return {
      channelCount,
      postCount: 0,
      commentsReceivedCount: 0,
      recentComments: [],
    };
  }

  const posts = postRows ?? [];
  const postCount = posts.length;
  if (postCount === 0) {
    return {
      channelCount,
      postCount: 0,
      commentsReceivedCount: 0,
      recentComments: [],
    };
  }

  const postIds = posts.map((p) => p.id);
  const postById = new Map(posts.map((p) => [p.id, p]));

  const [commentsCountRes, recentCommentsRes] = await Promise.all([
    supabase
      .from("topic_content_comments")
      .select("id", { count: "exact", head: true })
      .in("topic_content_id", postIds),
    supabase
      .from("topic_content_comments")
      .select("id, body, created_at, user_id, topic_content_id")
      .in("topic_content_id", postIds)
      .order("created_at", { ascending: false })
      .limit(RECENT_COMMENTS_LIMIT),
  ]);

  if (commentsCountRes.error) {
    console.warn(
      "[dashboard] comments count:",
      commentsCountRes.error.message
    );
  }
  if (recentCommentsRes.error) {
    console.warn(
      "[dashboard] recent comments:",
      recentCommentsRes.error.message
    );
  }

  const commentsReceivedCount = commentsCountRes.count ?? 0;
  const rawComments = recentCommentsRes.data ?? [];

  let displayNameById = new Map<string, string>();
  if (rawComments.length > 0) {
    const uniqueCommenterIds = [
      ...new Set(rawComments.map((c) => c.user_id).filter(Boolean)),
    ];
    if (uniqueCommenterIds.length > 0) {
      const { data: profileRows, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", uniqueCommenterIds);
      if (profilesErr) {
        console.warn("[dashboard] profiles:", profilesErr.message);
      } else {
        displayNameById = new Map(
          (profileRows ?? []).map((p) => [
            p.id,
            (p.display_name ?? "").trim() || "Anonymous",
          ])
        );
      }
    }
  }

  const recentComments: RecentCommentRow[] = [];
  for (const c of rawComments) {
    const post = postById.get(c.topic_content_id);
    if (!post) continue;
    const slug = channelSlugById.get(post.topic_id);
    if (!slug) continue;
    recentComments.push({
      id: c.id,
      commenterId: c.user_id,
      commenterName: displayNameById.get(c.user_id) ?? "Anonymous",
      snippet: makeSnippet(c.body),
      createdAt: c.created_at,
      postId: post.id,
      postTitle: (post.title ?? "").trim() || "Untitled",
      channelSlug: slug,
    });
  }

  return {
    channelCount,
    postCount,
    commentsReceivedCount,
    recentComments,
  };
}
