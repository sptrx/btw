"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { moderateContent } from "@/lib/moderation";

export type TopicContentType = "article" | "tutorial" | "debate" | "image" | "video";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createTopic(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  if (!title) return { error: "Title is required." };

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const { data: existing } = await supabase.from("topics").select("id").eq("slug", slug).single();
    if (!existing) break;
    slug = `${baseSlug}-${++suffix}`;
  }

  const { error } = await supabase.from("topics").insert({
    author_id: user.id,
    title,
    slug,
    description,
  });

  if (error) return { error: error.message };
  revalidatePath("/topics");
  revalidatePath("/dashboard");
  redirect(`/topics/${slug}`);
}

export async function updateTopic(topicId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: topic } = await supabase
    .from("topics")
    .select("author_id, slug")
    .eq("id", topicId)
    .single();
  if (!topic || topic.author_id !== user.id) redirect("/topics");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  if (!title) return { error: "Title is required." };

  await supabase
    .from("topics")
    .update({ title, description, updated_at: new Date().toISOString() })
    .eq("id", topicId);

  revalidatePath(`/topics/${topic.slug}`);
  redirect(`/topics/${topic.slug}`);
}

export async function getTopicBySlug(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topics")
    .select(`
      id,
      author_id,
      title,
      slug,
      description,
      cover_image_url,
      created_at,
      profiles:author_id (display_name, avatar_url)
    `)
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data;
}

export async function getTopicById(topicId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topics")
    .select(`
      id,
      author_id,
      title,
      slug,
      description,
      cover_image_url,
      created_at,
      profiles:author_id (display_name, avatar_url)
    `)
    .eq("id", topicId)
    .single();
  if (error || !data) return null;
  return data;
}

export async function getTopicContent(topicId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topic_content")
    .select(`
      id,
      type,
      title,
      body,
      media_urls,
      created_at,
      profiles:author_id (display_name)
    `)
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getTopicContentById(contentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topic_content")
    .select(`
      id,
      topic_id,
      type,
      title,
      body,
      media_urls,
      created_at,
      author_id,
      profiles:author_id (display_name, avatar_url)
    `)
    .eq("id", contentId)
    .single();
  if (error || !data) return null;
  return data;
}

export async function createTopicContent(topicId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug, author_id")
    .eq("id", topicId)
    .single();
  if (!topic || topic.author_id !== user.id) redirect("/topics");

  const type = formData.get("type") as TopicContentType;
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim() || null;

  if (!title || !["article", "tutorial", "debate", "image", "video"].includes(type))
    return { error: "Invalid content type or title." };

  const bodyToModerate = [title, body].filter(Boolean).join(" ");
  const result = await moderateContent(bodyToModerate);
  if (!result.allowed) return { error: result.reason ?? "Content not allowed." };

  const mediaUrls: { url: string; type: string; caption?: string }[] = [];
  const mediaStr = formData.get("media_urls") as string | null;
  if (mediaStr) {
    try {
      const parsed = JSON.parse(mediaStr);
      if (Array.isArray(parsed)) mediaUrls.push(...parsed);
    } catch {}
  }

  const { error } = await supabase.from("topic_content").insert({
    topic_id: topicId,
    author_id: user.id,
    type,
    title,
    body,
    media_urls: mediaUrls,
  });

  if (error) return { error: error.message };
  revalidatePath(`/topics/${topic.slug}`);
  redirect(`/topics/${topic.slug}`);
}

export async function isTopicAuthor(topicId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("topics")
    .select("author_id")
    .eq("id", topicId)
    .single();
  return data?.author_id === user.id;
}

export async function isTopicMemberApproved(topicId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("topic_members")
    .select("status")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .single();
  return data?.status === "approved";
}

export async function requestJoinTopic(topicId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: topic } = await supabase.from("topics").select("author_id").eq("id", topicId).single();
  if (!topic) return { error: "Topic not found." };
  if (topic.author_id === user.id) return { error: "You are the author." };

  const { error } = await supabase.from("topic_members").upsert(
    { topic_id: topicId, user_id: user.id, status: "pending" },
    { onConflict: "topic_id,user_id" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/topics/${topicId}`);
  return { success: true };
}

export async function approveMember(topicId: string, memberId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("id", topicId)
    .eq("author_id", user.id)
    .single();
  if (!topic) redirect("/topics");

  await supabase
    .from("topic_members")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", memberId)
    .eq("topic_id", topicId);

  revalidatePath(`/topics/${topic.slug}`);
  revalidatePath(`/dashboard/topics/${topicId}`);
}

export async function rejectMember(topicId: string, memberId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("id", topicId)
    .eq("author_id", user.id)
    .single();
  if (!topic) redirect("/topics");

  await supabase
    .from("topic_members")
    .update({ status: "rejected" })
    .eq("id", memberId)
    .eq("topic_id", topicId);

  revalidatePath(`/topics/${topic.slug}`);
  revalidatePath(`/dashboard/topics/${topicId}`);
}

export async function getTopicMembers(topicId: string, status?: "pending" | "approved" | "rejected") {
  const supabase = createClient();
  let q = supabase
    .from("topic_members")
    .select(`
      id,
      user_id,
      status,
      requested_at,
      approved_at,
      profiles:user_id (display_name)
    `)
    .eq("topic_id", topicId);
  if (status) q = q.eq("status", status);
  const { data } = await q.order("requested_at", { ascending: false });
  return data ?? [];
}

export async function getMyTopicMembership(topicId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("topic_members")
    .select("id, status")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .single();
  return data;
}

export async function addComment(contentId: string, body: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to comment." };

  const { data: content } = await supabase
    .from("topic_content")
    .select("topic_id")
    .eq("id", contentId)
    .single();
  if (!content) return { error: "Content not found." };

  const approved = await isTopicMemberApproved(content.topic_id);
  const isAuthor = await isTopicAuthor(content.topic_id);
  if (!approved && !isAuthor) return { error: "You must be an approved member to comment." };

  const result = await moderateContent(body);
  if (!result.allowed) return { error: result.reason ?? "Comment not allowed." };

  const { error } = await supabase.from("topic_content_comments").insert({
    topic_content_id: contentId,
    user_id: user.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath(`/topics/content/${contentId}`);
  return { success: true };
}

export async function getComments(contentId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("topic_content_comments")
    .select(`
      id,
      body,
      created_at,
      profiles:user_id (display_name)
    `)
    .eq("topic_content_id", contentId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function addFeedback(contentId: string, type: "like" | "helpful") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to give feedback." };

  const { data: content } = await supabase
    .from("topic_content")
    .select("topic_id")
    .eq("id", contentId)
    .single();
  if (!content) return { error: "Content not found." };

  const approved = await isTopicMemberApproved(content.topic_id);
  const isAuthor = await isTopicAuthor(content.topic_id);
  if (!approved && !isAuthor) return { error: "You must be an approved member to give feedback." };

  await supabase.from("topic_content_feedback").upsert(
    { topic_content_id: contentId, user_id: user.id, type },
    { onConflict: "topic_content_id,user_id,type" }
  );
  revalidatePath(`/topics/content/${contentId}`);
  return { success: true };
}

export async function removeFeedback(contentId: string, type: "like" | "helpful") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in." };

  await supabase
    .from("topic_content_feedback")
    .delete()
    .eq("topic_content_id", contentId)
    .eq("user_id", user.id)
    .eq("type", type);
  revalidatePath(`/topics/content/${contentId}`);
  return { success: true };
}

export async function shareContent(contentId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to share." };

  const { data: content } = await supabase
    .from("topic_content")
    .select("topic_id")
    .eq("id", contentId)
    .single();
  if (!content) return { error: "Content not found." };

  const approved = await isTopicMemberApproved(content.topic_id);
  const isAuthor = await isTopicAuthor(content.topic_id);
  if (!approved && !isAuthor) return { error: "You must be an approved member to share." };

  await supabase.from("topic_content_shares").insert({
    topic_content_id: contentId,
    user_id: user.id,
  });
  revalidatePath(`/topics/content/${contentId}`);
  return { success: true };
}

export async function getFeedbackCounts(contentId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("topic_content_feedback")
    .select("type")
    .eq("topic_content_id", contentId);
  const likes = data?.filter((r) => r.type === "like").length ?? 0;
  const helpful = data?.filter((r) => r.type === "helpful").length ?? 0;
  return { likes, helpful };
}

export async function getShareCount(contentId: string) {
  const supabase = createClient();
  const { count } = await supabase
    .from("topic_content_shares")
    .select("*", { count: "exact", head: true })
    .eq("topic_content_id", contentId);
  return count ?? 0;
}

export async function getUserHasFeedback(contentId: string, type: "like" | "helpful") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("topic_content_feedback")
    .select("id")
    .eq("topic_content_id", contentId)
    .eq("user_id", user.id)
    .eq("type", type)
    .single();
  return !!data;
}

export async function fetchTopics() {
  const supabase = createClient();
  const { data } = await supabase
    .from("topics")
    .select(`
      id,
      title,
      slug,
      description,
      created_at,
      profiles:author_id (display_name)
    `)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyTopics() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("topics")
    .select(`
      id,
      title,
      slug,
      description,
      created_at
    `)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}
