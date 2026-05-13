"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { moderateContent } from "@/lib/moderation";
import { fetchScriptureGuideReply, isScriptureGuideConfigured } from "@/lib/bible-ai";
import {
  getProfile,
  hasAcceptedContentDisclaimer,
  recordContentDisclaimerAcceptance,
} from "@/actions";
import { replaceChannelTags, replacePostTags } from "@/actions/tags";
import { createNotification } from "@/actions/notifications";

/** Caller-provided tag IDs from a form's hidden `tag_ids` inputs (capped to 3 client + server side). */
function readTagIdsFromForm(formData: FormData): string[] {
  return formData
    .getAll("tag_ids")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
}

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

  const tagIds = readTagIdsFromForm(formData);
  if (tagIds.length > 0) {
    await replaceChannelTags(channel.id, tagIds);
  }

  revalidatePath("/channel");
  revalidatePath("/channel/browse");
  redirect(`/channel/${slug}`);
}

export type FetchChannelsOptions = {
  /** Case-insensitive match on title or description (filtered in memory after fetch). */
  search?: string | null;
  /** When set, restrict to channels tagged with this `topic_tags.slug`. */
  topicSlug?: string | null;
};

/** Shape returned to the browse page (counts already unwrapped from PostgREST arrays). */
export type ChannelListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  banner_image_url: string | null;
  created_at: string;
  author_id: string;
  follower_count: number;
  post_count: number;
  tags: { id: string; slug: string; label: string }[];
  profiles: { display_name?: string } | null;
};

/**
 * When `topics.banner_image_url` is not migrated yet, PostgREST rejects selects
 * that reference it. Callers retry without it so /channel/browse still loads.
 */
function isMissingTopicsBannerImageUrlColumn(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (!msg.includes("banner_image_url")) return false;
  if (code === "42703") return true;
  if (code === "PGRST204") return true;
  return (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find")
  );
}

/** Row shape returned by the batched PostgREST select used below. */
type FetchChannelsRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  banner_image_url?: string | null;
  created_at: string;
  author_id: string;
  posts: { count: number }[] | null;
  followers: { count: number }[] | null;
  tags?:
    | { tag: { id: string; slug: string; label: string } | null }[]
    | null;
};

/**
 * Fallback when the topic-tags migration hasn't been applied yet — PostgREST
 * fails the embed and we drop the `tags:channel_tags(...)` clause. Same
 * 42P01 / 42703 / PGRST shape as the banner-column fallback above.
 */
function isMissingChannelTagsRelation(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (
    !msg.includes("channel_tags") &&
    !msg.includes("topic_tags") &&
    !msg.includes("post_tags")
  ) {
    return false;
  }
  if (code === "42P01" || code === "42703" || code.startsWith("PGRST")) return true;
  return (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find") ||
    msg.includes("could not embed")
  );
}

export async function fetchChannels(options?: FetchChannelsOptions): Promise<ChannelListItem[]> {
  const supabase = await createClient();

  // Optional topic filter: resolve the slug to the set of channel IDs that
  // carry that tag, then constrain the main fetch via `.in("id", …)`. Doing
  // this as a parallel pre-query is simpler/safer than relying on PostgREST's
  // nested `?tags.tag.slug=` syntax through the JS client.
  let topicChannelIds: string[] | null = null;
  const topicSlug = options?.topicSlug?.trim() || null;
  if (topicSlug) {
    const { data: tagRows, error: tagErr } = await supabase
      .from("channel_tags")
      .select("topic_id, tag:topic_tags!inner(slug)")
      .eq("tag.slug", topicSlug);
    if (tagErr) {
      // If the tags tables aren't there yet, treat the filter as "no matches"
      // so the page still renders empty rather than crashing.
      if (isMissingChannelTagsRelation(tagErr)) return [];
    }
    topicChannelIds = [
      ...new Set((tagRows ?? []).map((r) => (r as { topic_id: string }).topic_id)),
    ];
    if (topicChannelIds.length === 0) return [];
  }

  // One batched query: channels + embedded counts for posts (`topic_content`) and
  // approved followers (`topic_members` filtered to status='approved'). The
  // embedded filter is applied to the embedded resource only, so parent rows
  // (channels) with zero followers still come back. Tags are embedded via the
  // `channel_tags` join, with a "without-tags" fallback for environments where
  // the migration hasn't run.
  const run = (sel: string) => {
    let q = supabase
      .from("topics")
      .select(sel)
      .eq("topic_members.status", "approved")
      .order("created_at", { ascending: false });
    if (topicChannelIds) q = q.in("id", topicChannelIds);
    return q;
  };

  const baseWithBanner =
    "id, title, slug, description, banner_image_url, created_at, author_id, posts:topic_content(count), followers:topic_members(count)";
  const baseWithoutBanner =
    "id, title, slug, description, created_at, author_id, posts:topic_content(count), followers:topic_members(count)";
  const tagsEmbed = ", tags:channel_tags(tag:topic_tags(id, slug, label))";

  let { data, error } = await run(baseWithBanner + tagsEmbed);
  if (error && isMissingChannelTagsRelation(error)) {
    ({ data, error } = await run(baseWithBanner));
  }
  if (error && isMissingTopicsBannerImageUrlColumn(error)) {
    ({ data, error } = await run(baseWithoutBanner + tagsEmbed));
    if (error && isMissingChannelTagsRelation(error)) {
      ({ data, error } = await run(baseWithoutBanner));
    }
  }
  if (error || !data) return [];

  const rows = data as unknown as FetchChannelsRow[];
  const q = options?.search?.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (c) =>
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q))
      )
    : rows;

  const withProfiles: ChannelListItem[] = await Promise.all(
    filtered.map(async (c) => {
      const profile = await getProfile(c.author_id);
      const tags = (c.tags ?? [])
        .map((row) => row.tag)
        .filter((tag): tag is { id: string; slug: string; label: string } => Boolean(tag));
      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description ?? null,
        banner_image_url: c.banner_image_url ?? null,
        created_at: c.created_at,
        author_id: c.author_id,
        post_count: c.posts?.[0]?.count ?? 0,
        follower_count: c.followers?.[0]?.count ?? 0,
        tags,
        profiles: profile ? { display_name: profile.display_name } : null,
      };
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

  // The picker always submits a `tags_present=1` marker so we can distinguish
  // "form had no picker" from "user cleared every tag" (the latter must wipe
  // the existing tag set).
  if (formData.get("tags_present") === "1") {
    const tagIds = readTagIdsFromForm(formData);
    await replaceChannelTags(channelId, tagIds);
  }

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

/** Page row enriched with a derived content type + post count, used by the channel sidebar. */
export type ChannelSidebarPageRow = ChannelPageRow & {
  post_count: number;
  derived_type: "video" | "podcast" | "article" | "discussion" | "mixed";
};

/**
 * Mirrors the `readEmbeddedCount` defensive shape handling from `actions/landing.ts`:
 * PostgREST may return `{ count }` or `[{ count }]` depending on the embed.
 */
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

/** Heuristic: if a single content type covers ~60%+ of the page's posts, classify as that type, else "mixed". */
function classifyPageType(
  types: ReadonlyArray<string | null | undefined>
): ChannelSidebarPageRow["derived_type"] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const t of types) {
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return "mixed";
  let topType: string | null = null;
  let topCount = 0;
  for (const [t, n] of counts.entries()) {
    if (n > topCount) {
      topCount = n;
      topType = t;
    }
  }
  if (topType && (counts.size === 1 || topCount / total >= 0.6)) {
    if (
      topType === "video" ||
      topType === "podcast" ||
      topType === "article" ||
      topType === "discussion"
    ) {
      return topType;
    }
  }
  return "mixed";
}

/**
 * Sidebar variant of `getChannelPages` that also returns a per-page post count and a derived
 * content type. We embed `topic_content` once with a `(count)` aggregate (unwrapped via the
 * `readEmbeddedCount` defensive shape helper) for the badge, and fetch a slim flat list of
 * `(page_id, type)` pairs in the same channel to classify each page's dominant content type.
 * Falls back gracefully if either step fails.
 */
export async function getChannelSidebarPages(
  channelId: string
): Promise<ChannelSidebarPageRow[]> {
  const supabase = await createClient();

  type EmbedRow = {
    id: string;
    slug: string;
    title: string;
    sort_order: number | null;
    description?: string | null;
    posts?: { count: number }[] | { count: number } | null;
  };

  const run = (sel: string) =>
    supabase
      .from("channel_pages")
      .select(sel)
      .eq("channel_id", channelId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

  const embedSelect =
    "id, slug, title, sort_order, description, posts:topic_content(count)";

  let { data, error } = await run(embedSelect);
  if (error && isMissingChannelPagesDescriptionColumn(error)) {
    ({ data, error } = await run(
      "id, slug, title, sort_order, posts:topic_content(count)"
    ));
  }

  if (error) {
    console.error("getChannelSidebarPages", error.message);
    const fallback = await getChannelPages(channelId);
    return fallback.map((p) => ({
      ...p,
      post_count: 0,
      derived_type: "mixed" as const,
    }));
  }

  const rows = (data ?? []) as unknown as EmbedRow[];

  const { data: typeRows, error: typeErr } = await supabase
    .from("topic_content")
    .select("page_id, type")
    .eq("topic_id", channelId);
  if (typeErr) {
    console.warn("[channels] getChannelSidebarPages types:", typeErr.message);
  }

  const typesByPage = new Map<string, string[]>();
  for (const r of (typeRows ?? []) as { page_id: string | null; type: string | null }[]) {
    if (!r.page_id) continue;
    const arr = typesByPage.get(r.page_id) ?? [];
    if (r.type) arr.push(r.type);
    typesByPage.set(r.page_id, arr);
  }

  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    sort_order: p.sort_order,
    description: p.description ?? null,
    post_count: readEmbeddedCount(p.posts),
    derived_type: classifyPageType(typesByPage.get(p.id) ?? []),
  }));
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

  const acceptedDisclaimer = formData.get("accepted_disclaimer") === "1";
  const alreadyAccepted = await hasAcceptedContentDisclaimer(user.id);
  if (!alreadyAccepted && !acceptedDisclaimer) {
    return { error: "Please accept the content disclaimer before publishing." };
  }

  const type = formData.get("type") as ContentType;
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim() || null;

  if (!title || !["video", "podcast", "article", "discussion"].includes(type))
    return { error: "Invalid content type or title." };

  const result = await moderateContent([title, body].filter(Boolean).join(" "));
  if (!result.allowed) return { error: result.reason ?? "Content not allowed." };

  if (!alreadyAccepted && acceptedDisclaimer) {
    await recordContentDisclaimerAcceptance(user.id);
  }

  const mediaUrls: { url: string; type: string }[] = [];
  const mediaStr = formData.get("media_urls") as string | null;
  if (mediaStr) {
    try {
      const parsed = JSON.parse(mediaStr);
      if (Array.isArray(parsed)) mediaUrls.push(...parsed);
    } catch {}
  }

  const isFeatured = formData.get("is_featured") === "on";

  const { data: inserted, error: insertErr } = await supabase
    .from("topic_content")
    .insert({
      topic_id: channelId,
      page_id: pageId || null,
      author_id: user.id,
      type,
      title,
      body,
      media_urls: mediaUrls,
      is_featured: isFeatured,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[createContent] insert", insertErr);
    return { error: insertErr.message };
  }

  if (inserted?.id && formData.get("tags_present") === "1") {
    const tagIds = readTagIdsFromForm(formData);
    await replacePostTags(inserted.id, tagIds);
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

  const acceptedDisclaimer = formData.get("accepted_disclaimer") === "1";
  const alreadyAccepted = await hasAcceptedContentDisclaimer(user.id);
  if (!alreadyAccepted && !acceptedDisclaimer) {
    return { error: "Please accept the content disclaimer before saving." };
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

  if (!alreadyAccepted && acceptedDisclaimer) {
    await recordContentDisclaimerAcceptance(user.id);
  }

  const mediaUrls: { url: string; type: string }[] = [];
  const mediaStr = formData.get("media_urls") as string | null;
  if (mediaStr) {
    try {
      const parsed = JSON.parse(mediaStr);
      if (Array.isArray(parsed)) mediaUrls.push(...parsed);
    } catch {}
  }

  const isFeatured = formData.get("is_featured") === "on";

  const { error: upErr } = await supabase
    .from("topic_content")
    .update({
      type,
      title,
      body,
      page_id: pageId || null,
      media_urls: mediaUrls,
      is_featured: isFeatured,
    })
    .eq("id", contentId);

  if (upErr) return { error: upErr.message };

  if (formData.get("tags_present") === "1") {
    const tagIds = readTagIdsFromForm(formData);
    await replacePostTags(contentId, tagIds);
  }

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
export async function addComment(
  contentId: string,
  body: string,
  options?: {
    requestScriptureGuide?: boolean;
    translationId?: string;
    /** Set when the user ticked the disclaimer in this submission. Ignored if
     *  the profile already has a stored acceptance timestamp. */
    acceptedDisclaimer?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to comment." };

  // Once accepted (stamped on the profile), the disclaimer is silently
  // re-applied on subsequent submissions. Only first-time submitters must
  // explicitly opt in here.
  const alreadyAccepted = await hasAcceptedContentDisclaimer(user.id);
  if (!alreadyAccepted && !options?.acceptedDisclaimer) {
    return { error: "Please accept the content disclaimer before commenting." };
  }

  const result = await moderateContent(body);
  if (!result.allowed) return { error: result.reason ?? "Comment not allowed." };

  if (!alreadyAccepted && options?.acceptedDisclaimer) {
    await recordContentDisclaimerAcceptance(user.id);
  }

  const priorComments = await getComments(contentId);
  const content = await getContentById(contentId);

  const { data: inserted, error: insertErr } = await supabase
    .from("topic_content_comments")
    .insert({
      topic_content_id: contentId,
      user_id: user.id,
      body: body.trim(),
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[addComment] insert", insertErr);
    return { error: insertErr?.message ?? "Could not post comment." };
  }

  // Notify the post author. `content` was fetched above for the scripture
  // guide context, so we reuse it here instead of an extra round-trip.
  if (content?.author_id) {
    await createNotification({
      recipientId: content.author_id,
      actorId: user.id,
      type: "comment",
      topicContentId: contentId,
      commentId: inserted.id,
    });
  }

  revalidatePath(`/channel`);
  revalidatePath("/channel/browse");

  let guideError: string | undefined;

  if (options?.requestScriptureGuide) {
    if (!isScriptureGuideConfigured()) {
      guideError =
        "Scripture guide is not configured. Ask your admin to set BIBLE_AI_BASE_URL (and BIBLE_AI_API_KEY if required).";
    } else {
      const threadContext = priorComments
        .map((c) => {
          const name = c.profiles?.display_name?.trim() || "Member";
          return `[${name}]: ${c.body.trim()}`;
        })
        .join("\n\n");

      let pageContext: string | undefined;
      if (content?.title) {
        const excerpt = content.body?.trim()?.slice(0, 2000) ?? "";
        pageContext = excerpt
          ? `Title: ${content.title}\n\nArticle excerpt:\n${excerpt}`
          : `Title: ${content.title}`;
      }

      const guide = await fetchScriptureGuideReply({
        message: body.trim(),
        threadContext,
        pageContext,
        translationId: options.translationId,
      });

      if ("error" in guide) {
        guideError = guide.error;
      } else {
        const { error: updErr } = await supabase
          .from("topic_content_comments")
          .update({ scripture_guide_reply: guide.response })
          .eq("id", inserted.id);

        if (updErr) {
          console.error("[addComment] scripture_guide_reply update", updErr);
          guideError = "Comment saved but the Scripture guide reply could not be stored.";
        } else {
          revalidatePath(`/channel`);
          revalidatePath("/channel/browse");
        }
      }
    }
  }

  return { success: true as const, guideError };
}

export async function getComments(contentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_content_comments")
    .select("id, body, created_at, user_id, scripture_guide_reply")
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

  // We need to know whether this is a brand-new like (so we should notify the
  // post author) vs. a no-op re-tap. Check before the upsert; the partial
  // unique index on `notifications` would still dedupe at the DB layer, but
  // skipping the insert keeps the actor-side write count lower.
  const { data: existing } = await supabase
    .from("topic_content_feedback")
    .select("id")
    .eq("topic_content_id", contentId)
    .eq("user_id", user.id)
    .eq("type", type)
    .maybeSingle();

  await supabase.from("topic_content_feedback").upsert(
    { topic_content_id: contentId, user_id: user.id, type },
    { onConflict: "topic_content_id,user_id,type" }
  );

  if (type === "like" && !existing) {
    const { data: content } = await supabase
      .from("topic_content")
      .select("author_id")
      .eq("id", contentId)
      .single();
    if (content?.author_id) {
      await createNotification({
        recipientId: content.author_id,
        actorId: user.id,
        type: "like",
        topicContentId: contentId,
      });
    }
  }

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
  const baseCols =
    "id, topic_id, page_id, type, title, body, media_urls, created_at, author_id";
  let { data, error } = await supabase
    .from("topic_content")
    .select(`${baseCols}, is_featured`)
    .eq("id", contentId)
    .single();
  // Fallback if the `is_featured` migration hasn't been applied yet in this env.
  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("is_featured")) {
      ({ data, error } = await supabase
        .from("topic_content")
        .select(baseCols)
        .eq("id", contentId)
        .single());
    }
  }
  if (error || !data) return null;
  const profile = await getProfile(data.author_id);
  return {
    ...data,
    is_featured: (data as { is_featured?: boolean | null }).is_featured ?? false,
    profiles: profile ? { display_name: profile.display_name } : null,
  };
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
