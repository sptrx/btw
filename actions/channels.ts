"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { moderateContent } from "@/lib/moderation";
import { getProfile } from "@/actions";

export type ContentType = "video" | "podcast" | "article" | "discussion";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Channels = topics (same table), URL: /channel/[slug]
export async function createChannel(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfile(user.id);
  if (profile?.role !== "channel_author") {
    return { error: "Only channel authors can create channels. Sign up as a channel author." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  if (!title) return { error: "Title is required." };

  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = `channel-${Date.now().toString(36)}`;
  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const { data: existing } = await supabase.from("topics").select("id").eq("slug", slug).single();
    if (!existing) break;
    slug = `${baseSlug}-${++suffix}`;
  }

  const { data: channel, error } = await supabase
    .from("topics")
    .insert({ author_id: user.id, title, slug, description })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Create default home page
  await supabase.from("channel_pages").insert({
    channel_id: channel.id,
    slug: "home",
    title: "Home",
    sort_order: 0,
  });

  revalidatePath("/channel");
  redirect(`/channel/${slug}`);
}

export async function fetchChannels() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, title, slug, description, created_at, author_id")
    .order("created_at", { ascending: false });

  if (error) return [];
  const channels = data ?? [];
  const withProfiles = await Promise.all(
    channels.map(async (c) => {
      const profile = await getProfile(c.author_id);
      return { ...c, profiles: profile ? { display_name: profile.display_name } : null };
    })
  );
  return withProfiles;
}

export async function getChannelBySlug(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, author_id, title, slug, description, cover_image_url, created_at")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  const profile = await getProfile(data.author_id);
  return { ...data, profiles: profile ? { display_name: profile.display_name, avatar_url: profile.avatar_url } : null };
}

export async function getChannelPages(channelId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("channel_pages")
    .select("id, slug, title, sort_order")
    .eq("channel_id", channelId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function createChannelPage(channelId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: channel } = await supabase.from("topics").select("slug, author_id").eq("id", channelId).single();
  if (!channel || channel.author_id !== user.id) redirect("/channel");

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required." };

  const baseSlug = slugify(title) || `page-${Date.now().toString(36)}`;
  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const { data: ex } = await supabase.from("channel_pages").select("id").eq("channel_id", channelId).eq("slug", slug).single();
    if (!ex) break;
    slug = `${baseSlug}-${++suffix}`;
  }

  await supabase.from("channel_pages").insert({
    channel_id: channelId,
    slug,
    title,
    sort_order: 999,
  });

  revalidatePath(`/channel/${channel.slug}`);
  redirect(`/channel/${channel.slug}/${slug}`);
}

export async function getChannelPage(channelId: string, pageSlug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("channel_pages")
    .select("id, slug, title")
    .eq("channel_id", channelId)
    .eq("slug", pageSlug)
    .single();
  return data;
}

export async function getPageContent(channelId: string, pageId: string | null) {
  const supabase = createClient();
  let q = supabase
    .from("topic_content")
    .select("id, type, title, body, media_urls, created_at")
    .eq("topic_id", channelId);
  if (pageId) q = q.eq("page_id", pageId);
  else q = q.is("page_id", null);
  const { data } = await q.order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAllChannelContent(channelId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("topic_content")
    .select("id, type, title, body, media_urls, created_at, page_id")
    .eq("topic_id", channelId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function isChannelAuthor(channelId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("topics").select("author_id").eq("id", channelId).single();
  return data?.author_id === user.id;
}

export async function createContent(channelId: string, pageId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: channel } = await supabase.from("topics").select("slug, author_id").eq("id", channelId).single();
  if (!channel || channel.author_id !== user.id) redirect("/channel");

  const type = formData.get("type") as ContentType;
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim() || null;

  if (!title || !["video", "podcast", "article", "discussion"].includes(type))
    return { error: "Invalid content type or title." };

  const result = await moderateContent([title, body].filter(Boolean).join(" "));
  if (!result.allowed) return { error: result.reason ?? "Content not allowed." };

  const mediaUrls: { url: string; type: string }[] = [];
  const mediaStr = formData.get("media_urls") as string | null;
  if (mediaStr) {
    try {
      const parsed = JSON.parse(mediaStr);
      if (Array.isArray(parsed)) mediaUrls.push(...parsed);
    } catch {}
  }

  await supabase.from("topic_content").insert({
    topic_id: channelId,
    page_id: pageId || null,
    author_id: user.id,
    type,
    title,
    body,
    media_urls: mediaUrls,
  });

  revalidatePath(`/channel/${channel.slug}`);
  redirect(`/channel/${channel.slug}`);
}

export async function deleteChannelPage(channelId: string, pageId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: channel } = await supabase.from("topics").select("slug, author_id").eq("id", channelId).single();
  if (!channel || channel.author_id !== user.id) redirect("/channel");

  await supabase.from("channel_pages").delete().eq("id", pageId).eq("channel_id", channelId);
  revalidatePath(`/channel/${channel.slug}`);
  redirect(`/channel/${channel.slug}`);
}

export async function deleteContent(contentId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: content } = await supabase.from("topic_content").select("topic_id").eq("id", contentId).single();
  if (!content) redirect("/channel");

  const { data: topic } = await supabase.from("topics").select("author_id, slug").eq("id", content.topic_id).single();
  if (!topic || topic.author_id !== user.id) redirect("/channel");

  await supabase.from("topic_content").delete().eq("id", contentId);
  revalidatePath(`/channel/${topic.slug}`);
  redirect(`/channel/${topic.slug}`);
}

// Comments: any signed-in user (no membership)
export async function addComment(contentId: string, body: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to comment." };

  const result = await moderateContent(body);
  if (!result.allowed) return { error: result.reason ?? "Comment not allowed." };

  await supabase.from("topic_content_comments").insert({
    topic_content_id: contentId,
    user_id: user.id,
    body: body.trim(),
  });
  revalidatePath(`/channel`);
  return { success: true };
}

export async function getComments(contentId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("topic_content_comments")
    .select("id, body, created_at, user_id")
    .eq("topic_content_id", contentId)
    .order("created_at", { ascending: true });
  const comments = data ?? [];
  const withProfiles = await Promise.all(
    comments.map(async (c) => {
      const p = await getProfile(c.user_id);
      return { ...c, profiles: p ? { display_name: p.display_name } : null };
    })
  );
  return withProfiles;
}

export async function addFeedback(contentId: string, type: "like" | "helpful") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to give feedback." };

  await supabase.from("topic_content_feedback").upsert(
    { topic_content_id: contentId, user_id: user.id, type },
    { onConflict: "topic_content_id,user_id,type" }
  );
  revalidatePath(`/channel`);
  return { success: true };
}

export async function removeFeedback(contentId: string, type: "like" | "helpful") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in." };

  await supabase.from("topic_content_feedback").delete()
    .eq("topic_content_id", contentId).eq("user_id", user.id).eq("type", type);
  revalidatePath(`/channel`);
  return { success: true };
}

// Share: any signed-in user, and add copy-link for external share
export async function shareContent(contentId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to share." };

  await supabase.from("topic_content_shares").insert({
    topic_content_id: contentId,
    user_id: user.id,
  });
  revalidatePath(`/channel`);
  return { success: true };
}

export async function getContentById(contentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topic_content")
    .select("id, topic_id, type, title, body, media_urls, created_at, author_id")
    .eq("id", contentId)
    .single();
  if (error || !data) return null;
  const profile = await getProfile(data.author_id);
  return { ...data, profiles: profile ? { display_name: profile.display_name } : null };
}

export async function getFeedbackCounts(contentId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("topic_content_feedback").select("type").eq("topic_content_id", contentId);
  const likes = data?.filter((r) => r.type === "like").length ?? 0;
  const helpful = data?.filter((r) => r.type === "helpful").length ?? 0;
  return { likes, helpful };
}

export async function getShareCount(contentId: string) {
  const supabase = createClient();
  const { count } = await supabase.from("topic_content_shares").select("*", { count: "exact", head: true }).eq("topic_content_id", contentId);
  return count ?? 0;
}

export async function getUserHasFeedback(contentId: string, type: "like" | "helpful") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("topic_content_feedback").select("id")
    .eq("topic_content_id", contentId).eq("user_id", user.id).eq("type", type).single();
  return !!data;
}
