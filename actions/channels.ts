"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { moderateContent } from "@/lib/moderation";
import { getProfile } from "@/actions";

export type ContentType = "video" | "podcast" | "article" | "discussion";

/** Row from `channel_pages` (description optional when DB not migrated) */
export type ChannelPageRow = {
  id: string;
  slug: string;
  title: string;
  sort_order: number | null;
  description?: string | null;
  /** Present when selected (e.g. edit page) */
  updated_at?: string | null;
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Static app routes under /channel/* — cannot be used as channel slugs */
const RESERVED_CHANNEL_SLUGS = new Set([
  "new",
  "my",
  "browse",
  "api",
  "_next",
]);

/** Reserved URL segments for channel sub-pages (conflict with /channel/[slug]/...) */
const RESERVED_PAGE_SLUGS = new Set([
  "home",
  "settings",
  "content",
  "pages",
  "new",
  "api",
  "_next",
]);

/**
 * When `channel_pages.description` is not migrated yet, PostgREST fails selects/updates
 * that reference it — callers retry without `description` so pages still load.
 */
function isMissingChannelPagesDescriptionColumn(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (code === "42703") return true;
  if (code === "PGRST204" && msg.includes("description")) return true;
  if (
    msg.includes("description") &&
    (msg.includes("does not exist") ||
      msg.includes("schema cache") ||
      msg.includes("could not find"))
  ) {
    return true;
  }
  return false;
}

function assertPageSlugAllowed(slug: string): string | null {
  if (RESERVED_PAGE_SLUGS.has(slug)) {
    return "This URL path is reserved. Choose a different title or URL.";
  }
  return null;
}

function assertSlugAllowed(slug: string): string | null {
  if (RESERVED_CHANNEL_SLUGS.has(slug)) {
    return "This URL path is reserved. Choose a different title or URL.";
  }
  return null;
}

// Channels = topics (same table), URL: /channel/[slug]
export async function createChannel(formData: FormData) {
  const supabase = await createClient();
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

  const reservedErr = assertSlugAllowed(slug);
  if (reservedErr) return { error: reservedErr };

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
  revalidatePath("/channel/browse");
  redirect(`/channel/${slug}`);
}

export type FetchChannelsOptions = {
  /** Case-insensitive match on title or description (filtered in memory after fetch). */
  search?: string | null;
};

export async function fetchChannels(options?: FetchChannelsOptions) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, title, slug, description, created_at, author_id")
    .order("created_at", { ascending: false });

  if (error) return [];
  let channels = data ?? [];
  const q = options?.search?.trim().toLowerCase();
  if (q) {
    channels = channels.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }
  const withProfiles = await Promise.all(
    channels.map(async (c) => {
      const profile = await getProfile(c.author_id);
      return { ...c, profiles: profile ? { display_name: profile.display_name } : null };
    })
  );
  return withProfiles;
}

/** Channels owned by the signed-in user (for /channel hub) */
export async function fetchMyChannels() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("topics")
    .select("id, title, slug, description, created_at, author_id")
    .eq("author_id", user.id)
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

export async function updateChannel(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const channelId = (formData.get("channel_id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const slugInput = (formData.get("slug") as string)?.trim();

  if (!channelId) return { error: "Missing channel." };
  if (!title) return { error: "Title is required." };

  const { data: row, error: fetchErr } = await supabase
    .from("topics")
    .select("id, author_id, slug")
    .eq("id", channelId)
    .single();

  if (fetchErr || !row) return { error: "Channel not found." };
  if (row.author_id !== user.id) return { error: "You can only edit your own channels." };

  let nextSlug = row.slug;
  if (slugInput) {
    const candidate = slugify(slugInput);
    if (!candidate) return { error: "URL slug must contain letters or numbers." };
    const reservedErr = assertSlugAllowed(candidate);
    if (reservedErr) return { error: reservedErr };
    if (candidate !== row.slug) {
      const { data: clash } = await supabase
        .from("topics")
        .select("id")
        .eq("slug", candidate)
        .neq("id", channelId)
        .maybeSingle();
      if (clash) return { error: "That URL is already taken." };
      nextSlug = candidate;
    }
  }

  const { error: upErr } = await supabase
    .from("topics")
    .update({
      title,
      description,
      slug: nextSlug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", channelId);

  if (upErr) return { error: upErr.message };

  revalidatePath("/channel");
  revalidatePath("/channel/browse");
  revalidatePath("/channel/my");
  revalidatePath(`/channel/${row.slug}`);
  revalidatePath(`/channel/${nextSlug}`);
  redirect(`/channel/${nextSlug}/settings?updated=1`);
}

export async function deleteChannel(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const channelId = (formData.get("channel_id") as string)?.trim();
  if (!channelId) return { error: "Missing channel." };

  const { data: row } = await supabase
    .from("topics")
    .select("id, author_id, slug")
    .eq("id", channelId)
    .single();

  if (!row) return { error: "Channel not found." };
  if (row.author_id !== user.id) return { error: "You can only delete your own channels." };

  const { error: delErr } = await supabase.from("topics").delete().eq("id", channelId);
  if (delErr) return { error: delErr.message };

  revalidatePath("/channel");
  revalidatePath("/channel/browse");
  revalidatePath("/channel/my");
  revalidatePath(`/channel/${row.slug}`);
  redirect("/channel?deleted=1");
}

export async function getChannelBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, author_id, title, slug, description, cover_image_url, created_at")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  const profile = await getProfile(data.author_id);
  return { ...data, profiles: profile ? { display_name: profile.display_name, avatar_url: profile.avatar_url } : null };
}

export async function getChannelPages(channelId: string): Promise<ChannelPageRow[]> {
  const supabase = await createClient();
  const run = (sel: string) =>
    supabase
      .from("channel_pages")
      .select(sel)
      .eq("channel_id", channelId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

  let { data, error } = await run("id, slug, title, sort_order, description");
  if (error && isMissingChannelPagesDescriptionColumn(error)) {
    ({ data, error } = await run("id, slug, title, sort_order"));
  }
  if (error) {
    console.error("getChannelPages", error.message);
    return [];
  }
  return (data ?? []) as unknown as ChannelPageRow[];
}

export async function createChannelPage(channelId: string, formData: FormData) {
  const supabase = await createClient();
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
    if (assertPageSlugAllowed(slug)) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
      continue;
    }
    const { data: ex } = await supabase
      .from("channel_pages")
      .select("id")
      .eq("channel_id", channelId)
      .eq("slug", slug)
      .maybeSingle();
    if (!ex) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
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

export async function getChannelPage(
  channelId: string,
  pageSlug: string
): Promise<ChannelPageRow | null> {
  const supabase = await createClient();
  const run = (sel: string) =>
    supabase
      .from("channel_pages")
      .select(sel)
      .eq("channel_id", channelId)
      .eq("slug", pageSlug)
      .single();

  let { data, error } = await run("id, slug, title, sort_order, description");
  if (error && isMissingChannelPagesDescriptionColumn(error)) {
    ({ data, error } = await run("id, slug, title, sort_order"));
  }
  if (error) return null;
  return data as ChannelPageRow | null;
}

export async function getChannelPageById(
  channelId: string,
  pageId: string
): Promise<ChannelPageRow | null> {
  const supabase = await createClient();
  const run = (sel: string) =>
    supabase
      .from("channel_pages")
      .select(sel)
      .eq("channel_id", channelId)
      .eq("id", pageId)
      .maybeSingle();

  let { data, error } = await run("id, slug, title, sort_order, description, updated_at");
  if (error && isMissingChannelPagesDescriptionColumn(error)) {
    ({ data, error } = await run("id, slug, title, sort_order, updated_at"));
  }
  if (error) return null;
  return data as ChannelPageRow | null;
}

export async function updateChannelPage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const channelId = (formData.get("channel_id") as string)?.trim();
  const pageId = (formData.get("page_id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const slugInput = (formData.get("slug") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const sortOrderRaw = (formData.get("sort_order") as string)?.trim();

  if (!channelId || !pageId || !title) return { error: "Title is required." };

  const { data: channel } = await supabase
    .from("topics")
    .select("slug, author_id")
    .eq("id", channelId)
    .single();

  if (!channel || channel.author_id !== user.id) {
    return { error: "You can only edit pages on your own channels." };
  }

  const { data: pageRow } = await supabase
    .from("channel_pages")
    .select("id, slug, title, sort_order")
    .eq("id", pageId)
    .eq("channel_id", channelId)
    .single();

  if (!pageRow) return { error: "Page not found." };

  let nextSortOrder = pageRow.sort_order ?? 0;
  if (sortOrderRaw !== undefined && sortOrderRaw !== "") {
    const n = Number.parseInt(sortOrderRaw, 10);
    if (!Number.isFinite(n)) return { error: "Sort order must be a whole number." };
    nextSortOrder = n;
  }

  const now = new Date().toISOString();

  if (pageRow.slug === "home") {
    let { error: upErr } = await supabase
      .from("channel_pages")
      .update({
        title,
        description,
        sort_order: nextSortOrder,
        updated_at: now,
      })
      .eq("id", pageId);

    if (upErr && isMissingChannelPagesDescriptionColumn(upErr)) {
      ({ error: upErr } = await supabase
        .from("channel_pages")
        .update({
          title,
          sort_order: nextSortOrder,
          updated_at: now,
        })
        .eq("id", pageId));
    }

    if (upErr) return { error: upErr.message };

    revalidatePath(`/channel/${channel.slug}`);
    redirect(`/channel/${channel.slug}?page=updated`);
  }

  let nextSlug = pageRow.slug;
  if (slugInput !== undefined && slugInput.length > 0) {
    const candidate = slugify(slugInput);
    if (!candidate) return { error: "URL slug must contain letters or numbers." };
    const reservedErr = assertPageSlugAllowed(candidate);
    if (reservedErr) return { error: reservedErr };
    if (candidate !== pageRow.slug) {
      const { data: clash } = await supabase
        .from("channel_pages")
        .select("id")
        .eq("channel_id", channelId)
        .eq("slug", candidate)
        .neq("id", pageId)
        .maybeSingle();
      if (clash) return { error: "That URL is already used in this channel." };
    }
    nextSlug = candidate;
  }

  let { error: upErr } = await supabase
    .from("channel_pages")
    .update({
      title,
      slug: nextSlug,
      description,
      sort_order: nextSortOrder,
      updated_at: now,
    })
    .eq("id", pageId);

  if (upErr && isMissingChannelPagesDescriptionColumn(upErr)) {
    ({ error: upErr } = await supabase
      .from("channel_pages")
      .update({
        title,
        slug: nextSlug,
        sort_order: nextSortOrder,
        updated_at: now,
      })
      .eq("id", pageId));
  }

  if (upErr) return { error: upErr.message };

  revalidatePath(`/channel/${channel.slug}`);
  revalidatePath(`/channel/${channel.slug}/${pageRow.slug}`);
  revalidatePath(`/channel/${channel.slug}/${nextSlug}`);
  redirect(`/channel/${channel.slug}/${nextSlug}?page=updated`);
}

/** Row shape returned by `getPageContent` / `getPageContentForEditPage` */
export type PageContentListItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  media_urls: unknown;
  created_at: string;
};

export async function getPageContent(channelId: string, pageId: string | null) {
  const supabase = await createClient();
  let q = supabase
    .from("topic_content")
    .select("id, type, title, body, media_urls, created_at")
    .eq("topic_id", channelId);
  if (pageId) q = q.eq("page_id", pageId);
  else q = q.is("page_id", null);
  const { data } = await q.order("created_at", { ascending: false });
  return (data ?? []) as PageContentListItem[];
}

/**
 * Posts shown on this page in the editor. For the home page, merges legacy rows
 * with `page_id` null and rows linked to the home `channel_pages` row (same as public home).
 */
export async function getPageContentForEditPage(
  channelId: string,
  page: { id: string; slug: string }
): Promise<PageContentListItem[]> {
  if (page.slug !== "home") {
    return getPageContent(channelId, page.id);
  }
  const [legacy, linkedToHome] = await Promise.all([
    getPageContent(channelId, null),
    getPageContent(channelId, page.id),
  ]);
  const byId = new Map<string, PageContentListItem>();
  for (const item of linkedToHome) {
    byId.set(item.id, item);
  }
  for (const item of legacy) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getAllChannelContent(channelId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_content")
    .select("id, type, title, body, media_urls, created_at, page_id")
    .eq("topic_id", channelId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function isChannelAuthor(channelId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("topics").select("author_id").eq("id", channelId).single();
  return data?.author_id === user.id;
}

export async function createContent(channelId: string, pageId: string, formData: FormData) {
  const supabase = await createClient();
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

  const { error: insertErr } = await supabase.from("topic_content").insert({
    topic_id: channelId,
    page_id: pageId || null,
    author_id: user.id,
    type,
    title,
    body,
    media_urls: mediaUrls,
  });

  if (insertErr) {
    console.error("[createContent] insert", insertErr);
    return { error: insertErr.message };
  }

  revalidatePath(`/channel/${channel.slug}`);
  redirect(`/channel/${channel.slug}`);
}

export async function updateContent(contentId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: row } = await supabase
    .from("topic_content")
    .select("id, topic_id, author_id")
    .eq("id", contentId)
    .single();

  if (!row) return { error: "Content not found." };

  const { data: topic } = await supabase
    .from("topics")
    .select("slug, author_id")
    .eq("id", row.topic_id)
    .single();

  if (!topic || topic.author_id !== user.id) {
    return { error: "You can only edit content on your own channels." };
  }

  const type = formData.get("type") as ContentType;
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim() || null;
  const pageId = (formData.get("page_id") as string)?.trim() || null;

  if (!title || !["video", "podcast", "article", "discussion"].includes(type)) {
    return { error: "Invalid content type or title." };
  }

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

  const { error: upErr } = await supabase
    .from("topic_content")
    .update({
      type,
      title,
      body,
      page_id: pageId || null,
      media_urls: mediaUrls,
    })
    .eq("id", contentId);

  if (upErr) return { error: upErr.message };

  revalidatePath(`/channel/${topic.slug}`);
  revalidatePath(`/channel/${topic.slug}/content/${contentId}`);
  redirect(`/channel/${topic.slug}/content/${contentId}?updated=1`);
}

export async function deleteChannelPage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const channelId = (formData.get("channel_id") as string)?.trim();
  const pageId = (formData.get("page_id") as string)?.trim();
  if (!channelId || !pageId) return { error: "Missing page." };

  const { data: channel } = await supabase
    .from("topics")
    .select("slug, author_id")
    .eq("id", channelId)
    .single();

  if (!channel || channel.author_id !== user.id) {
    return { error: "You can only delete pages on your own channels." };
  }

  const { data: pageRow } = await supabase
    .from("channel_pages")
    .select("id, slug")
    .eq("id", pageId)
    .eq("channel_id", channelId)
    .single();

  if (!pageRow) return { error: "Page not found." };
  if (pageRow.slug === "home") {
    return { error: "The home page can't be deleted." };
  }

  const { data: homePage } = await supabase
    .from("channel_pages")
    .select("id")
    .eq("channel_id", channelId)
    .eq("slug", "home")
    .maybeSingle();

  if (homePage) {
    await supabase
      .from("topic_content")
      .update({ page_id: homePage.id })
      .eq("topic_id", channelId)
      .eq("page_id", pageId);
  } else {
    await supabase
      .from("topic_content")
      .update({ page_id: null })
      .eq("topic_id", channelId)
      .eq("page_id", pageId);
  }

  const { error: delErr } = await supabase
    .from("channel_pages")
    .delete()
    .eq("id", pageId)
    .eq("channel_id", channelId);

  if (delErr) return { error: delErr.message };

  revalidatePath(`/channel/${channel.slug}`);
  revalidatePath(`/channel/${channel.slug}/${pageRow.slug}`);
  redirect(`/channel/${channel.slug}?page=deleted`);
}

export async function deleteContent(contentId: string) {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  revalidatePath("/channel/browse");
  return { success: true };
}

export async function getComments(contentId: string) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to give feedback." };

  await supabase.from("topic_content_feedback").upsert(
    { topic_content_id: contentId, user_id: user.id, type },
    { onConflict: "topic_content_id,user_id,type" }
  );
  revalidatePath(`/channel`);
  revalidatePath("/channel/browse");
  return { success: true };
}

export async function removeFeedback(contentId: string, type: "like" | "helpful") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in." };

  await supabase.from("topic_content_feedback").delete()
    .eq("topic_content_id", contentId).eq("user_id", user.id).eq("type", type);
  revalidatePath(`/channel`);
  revalidatePath("/channel/browse");
  return { success: true };
}

// Share: any signed-in user, and add copy-link for external share
export async function shareContent(contentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to share." };

  await supabase.from("topic_content_shares").insert({
    topic_content_id: contentId,
    user_id: user.id,
  });
  revalidatePath(`/channel`);
  revalidatePath("/channel/browse");
  return { success: true };
}

export async function getContentById(contentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topic_content")
    .select("id, topic_id, page_id, type, title, body, media_urls, created_at, author_id")
    .eq("id", contentId)
    .single();
  if (error || !data) return null;
  const profile = await getProfile(data.author_id);
  return { ...data, profiles: profile ? { display_name: profile.display_name } : null };
}

export async function getFeedbackCounts(contentId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("topic_content_feedback").select("type").eq("topic_content_id", contentId);
  const likes = data?.filter((r) => r.type === "like").length ?? 0;
  const helpful = data?.filter((r) => r.type === "helpful").length ?? 0;
  return { likes, helpful };
}

export async function getShareCount(contentId: string) {
  const supabase = await createClient();
  const { count } = await supabase.from("topic_content_shares").select("*", { count: "exact", head: true }).eq("topic_content_id", contentId);
  return count ?? 0;
}

export async function getUserHasFeedback(contentId: string, type: "like" | "helpful") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("topic_content_feedback").select("id")
    .eq("topic_content_id", contentId).eq("user_id", user.id).eq("type", type).single();
  return !!data;
}
