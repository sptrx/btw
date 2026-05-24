"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { CONTENT_TYPE_LABELS, type ContentType } from "@/lib/content-types";

export type WalkingWithChannel = {
  topicId: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  walkedSince: string;
};

export type KeptPost = {
  savedAt: string;
  contentId: string;
  title: string;
  type: ContentType;
  typeLabel: string;
  channelSlug: string;
  channelTitle: string;
  href: string;
  bodySnippet: string | null;
};

export type UserLibrary = {
  walkingWith: WalkingWithChannel[];
  kept: KeptPost[];
};

async function requireUserId(): Promise<string | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to continue." };
  return user.id;
}

export async function isWalkingWithChannel(
  topicId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_members")
    .select("id")
    .eq("topic_id", topicId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .maybeSingle();
  return Boolean(data);
}

export async function isContentKept(contentId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_content")
    .select("id")
    .eq("topic_content_id", contentId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function walkWithChannel(
  topicId: string,
  channelSlug: string
): Promise<{ success: true } | { error: string }> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("author_id")
    .eq("id", topicId)
    .maybeSingle();
  if (!topic) return { error: "Channel not found." };
  if (topic.author_id === userId) return { error: "You cannot walk with your own channel." };

  await supabase.from("topic_members").delete().eq("topic_id", topicId).eq("user_id", userId);

  const { error } = await supabase.from("topic_members").insert({
    topic_id: topicId,
    user_id: userId,
    status: "approved",
    approved_at: new Date().toISOString(),
    approved_by: userId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/channel/${channelSlug}`);
  revalidatePath("/channel/browse");
  revalidatePath("/dashboard/library");
  return { success: true };
}

export async function stopWalkingWithChannel(
  topicId: string,
  channelSlug: string
): Promise<{ success: true } | { error: string }> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const supabase = await createClient();
  const { error } = await supabase
    .from("topic_members")
    .delete()
    .eq("topic_id", topicId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/channel/${channelSlug}`);
  revalidatePath("/channel/browse");
  revalidatePath("/dashboard/library");
  return { success: true };
}

export async function keepContent(
  contentId: string,
  channelSlug: string
): Promise<{ success: true } | { error: string }> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const supabase = await createClient();
  const { error } = await supabase.from("saved_content").insert({
    user_id: userId,
    topic_content_id: contentId,
  });

  if (error) {
    if (error.code === "23505") return { success: true };
    return { error: error.message };
  }

  revalidatePath(`/channel/${channelSlug}/content/${contentId}`);
  revalidatePath("/dashboard/library");
  return { success: true };
}

export async function unkeepContent(
  contentId: string,
  channelSlug: string
): Promise<{ success: true } | { error: string }> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_content")
    .delete()
    .eq("topic_content_id", contentId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/channel/${channelSlug}/content/${contentId}`);
  revalidatePath("/dashboard/library");
  return { success: true };
}

function snippet(body: string | null | undefined, max = 160): string | null {
  if (!body?.trim()) return null;
  const t = body.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max).trim()}…`;
}

export async function getUserLibrary(userId: string): Promise<UserLibrary> {
  const supabase = await createClient();

  const { data: memberRows } = await supabase
    .from("topic_members")
    .select(
      "approved_at, requested_at, topics:topic_id ( id, title, slug, description, cover_image_url )"
    )
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("approved_at", { ascending: false, nullsFirst: false });

  const walkingWith: WalkingWithChannel[] = [];
  for (const row of memberRows ?? []) {
    const topic = row.topics as
      | {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
        }
      | null;
    if (!topic) continue;
    walkingWith.push({
      topicId: topic.id,
      title: topic.title,
      slug: topic.slug,
      description: topic.description,
      coverImageUrl: topic.cover_image_url,
      walkedSince: row.approved_at ?? row.requested_at ?? new Date().toISOString(),
    });
  }

  const { data: savedRows } = await supabase
    .from("saved_content")
    .select(
      `
      created_at,
      topic_content:topic_content_id (
        id,
        title,
        type,
        body,
        topics:topic_id ( title, slug )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const kept: KeptPost[] = [];
  for (const row of savedRows ?? []) {
    const content = row.topic_content as
      | {
          id: string;
          title: string;
          type: ContentType;
          body: string | null;
          topics: { title: string; slug: string } | null;
        }
      | null;
    if (!content?.topics) continue;
    const type = content.type ?? "article";
    kept.push({
      savedAt: row.created_at,
      contentId: content.id,
      title: content.title,
      type,
      typeLabel: CONTENT_TYPE_LABELS[type] ?? type,
      channelSlug: content.topics.slug,
      channelTitle: content.topics.title,
      href: `/channel/${content.topics.slug}/content/${content.id}`,
      bodySnippet: snippet(content.body),
    });
  }

  return { walkingWith, kept };
}
