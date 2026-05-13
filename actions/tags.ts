"use server";

import { createClient } from "@/utils/supabase/server";

export type TopicTag = {
  id: string;
  slug: string;
  label: string;
};

/**
 * Cap any caller-provided tag list at 3 (UI enforces this via TopicTagPicker;
 * we also enforce it here as defense-in-depth so a crafted request can't
 * over-tag a channel/post and clutter the browse filter).
 */
const MAX_TAGS = 3;

function dedupeAndCap(tagIds: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of tagIds) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/** Used by tag pickers (channel/post forms) and the /channel/browse pill row. */
export async function getAllTopicTags(): Promise<TopicTag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topic_tags")
    .select("id, slug, label")
    .order("display_order", { ascending: true })
    .order("label", { ascending: true });
  if (error) {
    // Missing table (migration not yet applied) — return empty so callers
    // gracefully degrade rather than crash the page.
    if (isMissingTopicTagsRelation(error)) return [];
    console.warn("[tags] getAllTopicTags:", error.message);
    return [];
  }
  return (data ?? []) as TopicTag[];
}

/** Tags currently attached to a channel (used to pre-fill the edit picker). */
export async function getChannelTagIds(channelId: string): Promise<string[]> {
  if (!channelId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("channel_tags")
    .select("tag_id")
    .eq("topic_id", channelId);
  if (error) {
    if (isMissingTopicTagsRelation(error)) return [];
    console.warn("[tags] getChannelTagIds:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.tag_id as string);
}

/** Tags currently attached to a post (used to pre-fill the edit picker). */
export async function getPostTagIds(postId: string): Promise<string[]> {
  if (!postId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_tags")
    .select("tag_id")
    .eq("topic_content_id", postId);
  if (error) {
    if (isMissingTopicTagsRelation(error)) return [];
    console.warn("[tags] getPostTagIds:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.tag_id as string);
}

/**
 * Delete-then-insert the channel's tag set. Caps at 3 server-side. RLS enforces
 * that only the channel author may touch this join table.
 */
export async function replaceChannelTags(
  channelId: string,
  tagIds: string[]
): Promise<{ error?: string }> {
  if (!channelId) return { error: "Missing channel." };
  const next = dedupeAndCap(tagIds);
  const supabase = await createClient();

  const { error: delErr } = await supabase
    .from("channel_tags")
    .delete()
    .eq("topic_id", channelId);
  if (delErr) {
    if (isMissingTopicTagsRelation(delErr)) return {};
    return { error: delErr.message };
  }

  if (next.length === 0) return {};

  const { error: insErr } = await supabase
    .from("channel_tags")
    .insert(next.map((tagId) => ({ topic_id: channelId, tag_id: tagId })));
  if (insErr) {
    if (isMissingTopicTagsRelation(insErr)) return {};
    return { error: insErr.message };
  }
  return {};
}

/**
 * Delete-then-insert the post's tag set. Caps at 3 server-side. RLS enforces
 * post-author or parent-channel-author authorisation.
 */
export async function replacePostTags(
  postId: string,
  tagIds: string[]
): Promise<{ error?: string }> {
  if (!postId) return { error: "Missing post." };
  const next = dedupeAndCap(tagIds);
  const supabase = await createClient();

  const { error: delErr } = await supabase
    .from("post_tags")
    .delete()
    .eq("topic_content_id", postId);
  if (delErr) {
    if (isMissingTopicTagsRelation(delErr)) return {};
    return { error: delErr.message };
  }

  if (next.length === 0) return {};

  const { error: insErr } = await supabase
    .from("post_tags")
    .insert(next.map((tagId) => ({ topic_content_id: postId, tag_id: tagId })));
  if (insErr) {
    if (isMissingTopicTagsRelation(insErr)) return {};
    return { error: insErr.message };
  }
  return {};
}

/**
 * PostgREST returns 42P01 (relation does not exist) or schema-cache messages
 * when the migration hasn't been applied yet. Callers treat that as "no tags"
 * so /channel/browse and forms still render before `supabase db push` runs.
 */
function isMissingTopicTagsRelation(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (code === "42P01" || code === "42703" || code.startsWith("PGRST")) {
    if (
      msg.includes("topic_tags") ||
      msg.includes("channel_tags") ||
      msg.includes("post_tags")
    ) {
      return true;
    }
  }
  if (
    msg.includes("topic_tags") ||
    msg.includes("channel_tags") ||
    msg.includes("post_tags")
  ) {
    if (
      msg.includes("does not exist") ||
      msg.includes("schema cache") ||
      msg.includes("could not find")
    ) {
      return true;
    }
  }
  return false;
}
