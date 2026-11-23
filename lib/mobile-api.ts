import "server-only";

import { createClient } from "@/utils/supabase/server";
import {
  getCurrentUser,
  getProfile,
  hasAcceptedContentDisclaimer,
  updateProfile,
} from "@/actions";
import { deleteCurrentUser } from "@/actions/auth";
import {
  addComment,
  fetchChannels,
  getChannelBySlug,
  getChannelPages,
  getComments,
  getContentById,
  getPageContent,
  getPageContentForEditPage,
  isChannelAuthor,
} from "@/actions/channels";
import {
  getCommunityFeedPage,
  getForYouFeedPage,
  type CommunityFeedCursor,
} from "@/actions/feed";
import { followUser, getFollowCounts, unfollowUser } from "@/actions/follows";
import {
  deleteJournalNote,
  listJournalNotes,
  upsertJournalNote,
} from "@/actions/journal";
import {
  getShareableLibrary,
  keepContent,
  unkeepContent,
} from "@/actions/library";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
} from "@/actions/notification-prefs";
import {
  addPrayerComment,
  createPrayerRequest,
  getPraiseReports,
  getPrayerComments,
  getPrayerRequestById,
  getPrayerWallFeed,
  markPrayerAnswered,
  togglePrayer,
  type PrayerWallFilter,
} from "@/actions/prayer";
import { clearPostReaction, getPostReactions, setPostReaction } from "@/actions/reactions";
import {
  completeWordOfGodPractice,
  getTodaysWordOfGod,
} from "@/actions/word-of-god";
import {
  fetchBibleBooks,
  fetchBibleChapter,
  fetchBibleTranslations,
  isScriptureGuideConfigured,
} from "@/lib/bible-ai";
import { POST_REACTION_TYPES, type FeedPostKind, type PostReactionType } from "@/lib/post-reactions";
import { SHARING_FEED_FILTERS, type SharingFeedFilter } from "@/lib/sharing-types";

/**
 * JSON API for the BTW mobile app (`POST /api/mobile/<action>`).
 *
 * Every handler delegates to an existing server action, so the app gets the same
 * auth checks, AI moderation and RLS as the website. Only "use server" actions are
 * exposed here; those are already callable by any browser with arbitrary
 * arguments, so this adds no new capability, just a transport the app can use.
 */

export class MobileApiError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}

type Args = Record<string, unknown>;
type Handler = (args: Args) => Promise<unknown>;

const FEED_FILTERS = new Set<string>(SHARING_FEED_FILTERS.map((f) => f.id));
const PRAYER_FILTERS = new Set<PrayerWallFilter>(["all", "unanswered", "answered", "mine"]);
const POST_KINDS = new Set<FeedPostKind>(["topic_content", "prayer_request", "praise_report"]);

function str(args: Args, key: string, opts: { required?: boolean; max?: number } = {}): string {
  const raw = args[key];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (opts.required && !value) throw new MobileApiError(`Missing "${key}".`);
  if (opts.max && value.length > opts.max) throw new MobileApiError(`"${key}" is too long.`);
  return value;
}

function bool(args: Args, key: string): boolean {
  return args[key] === true;
}

function snippet(text: string | null | undefined, max = 280): string | null {
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t;
}

export function parseMediaItems(raw: unknown): { url: string; type: string }[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is { url: string; type?: unknown } =>
      Boolean(m && typeof (m as { url?: unknown }).url === "string")
    )
    .map((m) => ({ url: m.url, type: typeof m.type === "string" ? m.type : "link" }));
}

function readCursor(raw: unknown): CommunityFeedCursor | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (
    typeof c.createdAt !== "string" ||
    typeof c.id !== "string" ||
    !POST_KINDS.has(c.postKind as FeedPostKind)
  ) {
    return null;
  }
  return { createdAt: c.createdAt, id: c.id, postKind: c.postKind as FeedPostKind };
}

/** Server actions end with `redirect()` on success; in a route handler that throws. */
export function redirectTarget(error: unknown): string | null {
  const digest = (error as { digest?: unknown } | null)?.digest;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT;")) return null;
  return digest.split(";")[2] ?? null;
}

async function untilRedirect<T>(run: () => Promise<T>): Promise<T | { redirectTo: string }> {
  try {
    return await run();
  } catch (error) {
    const target = redirectTarget(error);
    if (target === null) throw error;
    return { redirectTo: target };
  }
}

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new MobileApiError("Please sign in.", 401);
  return user.id;
}

export const mobileHandlers: Record<string, Handler> = {
  async me() {
    const user = await getCurrentUser();
    if (!user) return { user: null };
    const [profile, disclaimerAccepted, follows] = await Promise.all([
      getProfile(user.id),
      hasAcceptedContentDisclaimer(user.id),
      getFollowCounts(user.id),
    ]);
    return {
      user: { id: user.id, email: user.email ?? null },
      profile,
      disclaimerAccepted,
      follows,
    };
  },

  async feed(args) {
    const mode = str(args, "mode") || str(args, "filter") || "all";
    const category = (str(args, "category") || "all") as SharingFeedFilter;
    const cursor = readCursor(args.cursor);

    if (mode === "for_you") {
      if (category !== "all" && !FEED_FILTERS.has(category)) {
        throw new MobileApiError("Unknown category.");
      }
      return getForYouFeedPage(category, 20, cursor);
    }

    if (mode === "following") {
      return getCommunityFeedPage("following", 20, cursor);
    }

    if (!FEED_FILTERS.has(mode)) throw new MobileApiError("Unknown feed filter.");
    return getCommunityFeedPage(mode as SharingFeedFilter, 20, cursor);
  },

  async "bible.translations"() {
    if (!isScriptureGuideConfigured()) {
      throw new MobileApiError("Bible reading is not available right now.", 503);
    }
    const result = await fetchBibleTranslations();
    if ("error" in result) throw new MobileApiError(result.error, 502);
    return result;
  },

  async "bible.books"(args) {
    if (!isScriptureGuideConfigured()) {
      throw new MobileApiError("Bible reading is not available right now.", 503);
    }
    const translationId = str(args, "translationId", { max: 32 }) || "kjv";
    const result = await fetchBibleBooks(translationId);
    if ("error" in result) throw new MobileApiError(result.error, 502);
    return result;
  },

  async "bible.chapter"(args) {
    if (!isScriptureGuideConfigured()) {
      throw new MobileApiError("Bible reading is not available right now.", 503);
    }
    const translationId = str(args, "translationId", { max: 32 }) || "kjv";
    const book = str(args, "book", { required: true, max: 64 });
    const chapterRaw = args.chapter;
    const chapter =
      typeof chapterRaw === "number"
        ? chapterRaw
        : typeof chapterRaw === "string"
          ? Number(chapterRaw)
          : NaN;
    if (!Number.isFinite(chapter) || chapter < 1) {
      throw new MobileApiError("chapter must be a positive integer.");
    }
    const result = await fetchBibleChapter({
      translationId,
      book,
      chapter: Math.floor(chapter),
    });
    if ("error" in result) throw new MobileApiError(result.error, 502);
    return result;
  },

  async "wordOfGod.today"() {
    return getTodaysWordOfGod();
  },

  async "wordOfGod.practice"(args) {
    return completeWordOfGodPractice(str(args, "attempt", { required: true, max: 8000 }));
  },

  async library(args) {
    const key = str(args, "username") || str(args, "userId");
    if (!key) {
      const user = await getCurrentUser();
      if (!user) throw new MobileApiError("Please sign in.", 401);
      const result = await getShareableLibrary(user.id);
      if ("error" in result) throw new MobileApiError(result.error, 404);
      return result;
    }
    const result = await getShareableLibrary(key);
    if ("error" in result) throw new MobileApiError(result.error, 404);
    return result;
  },

  async "library.keep"(args) {
    const contentId = str(args, "contentId", { required: true, max: 64 });
    const channelSlug = str(args, "channelSlug", { required: true, max: 200 });
    return bool(args, "keep")
      ? keepContent(contentId, channelSlug)
      : unkeepContent(contentId, channelSlug);
  },

  async "journal.list"() {
    const userId = await requireUserId();
    return listJournalNotes(userId);
  },

  async "journal.save"(args) {
    return upsertJournalNote({
      id: str(args, "id", { max: 64 }) || undefined,
      title: str(args, "title", { required: true, max: 200 }),
      body: str(args, "body", { required: true, max: 20000 }),
      isPublic: bool(args, "isPublic"),
    });
  },

  async "journal.delete"(args) {
    return deleteJournalNote(str(args, "id", { required: true, max: 64 }));
  },

  async "notifications.get"() {
    return getNotificationPrefs();
  },

  async "notifications.update"(args) {
    const patch: Record<string, boolean> = {};
    for (const key of [
      "prayerUpdates",
      "comments",
      "follows",
      "reactions",
      "wordOfGodReminder",
      "channelUpdates",
    ] as const) {
      if (key in args) patch[key] = bool(args, key);
    }
    return updateNotificationPrefs(patch);
  },

  async channels(args) {
    const channels = await fetchChannels({ search: str(args, "search", { max: 100 }) || undefined });
    return channels.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: snippet(c.description, 200),
      bannerUrl: c.banner_image_url,
      postCount: c.post_count,
      followerCount: c.follower_count,
      authorName: c.profiles?.display_name ?? null,
      tags: c.tags,
    }));
  },

  async channel(args) {
    const slug = str(args, "slug", { required: true, max: 200 });
    const pageSlug = str(args, "pageSlug", { max: 200 }) || "home";
    const channel = await getChannelBySlug(slug);
    if (!channel) throw new MobileApiError("Channel not found.", 404);

    const [pages, isAuthor] = await Promise.all([
      getChannelPages(channel.id),
      isChannelAuthor(channel.id),
    ]);
    const homePage = pages.find((p) => p.slug === "home");
    const page = pageSlug === "home" ? homePage : pages.find((p) => p.slug === pageSlug);
    if (pageSlug !== "home" && !page) throw new MobileApiError("Page not found.", 404);

    const options = { includeNonApproved: isAuthor };
    const content =
      page && page.slug !== "home"
        ? await getPageContent(channel.id, page.id, options)
        : homePage
          ? await getPageContentForEditPage(channel.id, homePage, options)
          : await getPageContent(channel.id, null, options);

    return {
      channel: {
        id: channel.id,
        slug: channel.slug,
        title: channel.title,
        description: channel.description,
        bannerUrl: channel.banner_image_url ?? channel.cover_image_url ?? null,
        archived: Boolean(channel.archived_at),
        authorName: channel.profiles?.display_name ?? null,
      },
      pages: pages
        .filter((p) => !p.archived_at)
        .map((p) => ({ id: p.id, slug: p.slug, title: p.title })),
      currentPage: {
        slug: page?.slug ?? "home",
        title: page?.title ?? "Home",
        description: page?.description ?? null,
      },
      content: content.map((c) => ({
        id: c.id,
        type: c.type,
        typeLabel: c.type_label,
        sharingType: c.sharing_type,
        sharingLabel: c.sharing_label,
        title: c.title,
        bodySnippet: snippet(c.body),
        createdAt: c.created_at,
        pageTitle: c.page_title,
        media: parseMediaItems(c.media_urls),
      })),
    };
  },

  async content(args) {
    const id = str(args, "id", { required: true, max: 64 });
    const user = await getCurrentUser();
    const content = await getContentById(id, { viewerUserId: user?.id ?? null });
    if (!content) throw new MobileApiError("This post isn't available.", 404);

    const supabase = await createClient();
    const [{ data: channel }, comments, reactions, disclaimerAccepted] = await Promise.all([
      supabase.from("topics").select("slug, title").eq("id", content.topic_id).maybeSingle(),
      getComments(id),
      getPostReactions([{ postId: id, postKind: "topic_content" }]),
      user ? hasAcceptedContentDisclaimer(user.id) : Promise.resolve(false),
    ]);
    const reaction = reactions.get(`topic_content:${id}`);

    return {
      post: {
        id: content.id,
        type: content.type,
        sharingType: (content as { sharing_type?: string | null }).sharing_type ?? null,
        title: content.title,
        body: content.body,
        scriptureReference:
          (content as { scripture_reference?: string | null }).scripture_reference ?? null,
        createdAt: content.created_at,
        authorId: content.author_id,
        authorName: content.profiles?.display_name ?? null,
        moderationStatus: content.moderation_status,
        media: parseMediaItems(content.media_urls),
        channelSlug: channel?.slug ?? null,
        channelTitle: channel?.title ?? null,
      },
      comments: comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        authorId: c.user_id,
        authorName: c.profiles?.display_name ?? null,
        scriptureGuideReply: c.scripture_guide_reply ?? null,
      })),
      reactions: reaction?.counts ?? null,
      userReaction: reaction?.userReaction ?? null,
      disclaimerAccepted,
    };
  },

  async "content.comment"(args) {
    const id = str(args, "id", { required: true, max: 64 });
    const body = str(args, "body", { required: true, max: 5000 });
    return addComment(id, body, {
      acceptedDisclaimer: bool(args, "acceptedDisclaimer"),
      requestScriptureGuide: bool(args, "requestScriptureGuide"),
    });
  },

  async react(args) {
    const postId = str(args, "postId", { required: true, max: 64 });
    const postKind = str(args, "postKind", { required: true }) as FeedPostKind;
    if (!POST_KINDS.has(postKind)) throw new MobileApiError("Unknown post kind.");
    const reaction = str(args, "reaction");
    if (!reaction) return clearPostReaction(postId, postKind);
    if (!POST_REACTION_TYPES.includes(reaction as PostReactionType)) {
      throw new MobileApiError("Unknown reaction.");
    }
    return setPostReaction(postId, postKind, reaction as PostReactionType);
  },

  async prayers(args) {
    const filter = (str(args, "filter") || "all") as PrayerWallFilter;
    if (!PRAYER_FILTERS.has(filter)) throw new MobileApiError("Unknown prayer filter.");
    const [requests, praise] = await Promise.all([
      getPrayerWallFeed(filter, 50),
      filter === "all" || filter === "answered" ? getPraiseReports(10) : Promise.resolve([]),
    ]);
    return { requests, praise };
  },

  async prayer(args) {
    const id = str(args, "id", { required: true, max: 64 });
    const request = await getPrayerRequestById(id);
    if (!request) throw new MobileApiError("This prayer request isn't available.", 404);
    return { request, comments: await getPrayerComments(id) };
  },

  async "prayer.create"(args) {
    const result = await untilRedirect(() =>
      createPrayerRequest(
        formData({
          title: str(args, "title", { max: 200 }),
          body: str(args, "body", { max: 5000 }),
          is_anonymous: bool(args, "isAnonymous") ? "on" : "",
          accepted_disclaimer: bool(args, "acceptedDisclaimer") ? "1" : "",
        })
      )
    );
    if ("redirectTo" in result) {
      const match = result.redirectTo.match(/^\/prayer\/([^/?#]+)/);
      if (!match) throw new MobileApiError("Please sign in.", 401);
      return { success: true, id: match[1] };
    }
    return result;
  },

  async "prayer.toggle"(args) {
    return togglePrayer(str(args, "id", { required: true, max: 64 }));
  },

  async "prayer.comment"(args) {
    return addPrayerComment(
      str(args, "id", { required: true, max: 64 }),
      str(args, "body", { required: true, max: 2000 })
    );
  },

  async "prayer.answered"(args) {
    return markPrayerAnswered(
      str(args, "id", { required: true, max: 64 }),
      str(args, "body", { required: true, max: 5000 })
    );
  },

  async "profile.update"(args) {
    const userId = await requireUserId();
    const current = await getProfile(userId);
    const field = (key: string, fallback: string | null | undefined) =>
      key in args ? str(args, key, { max: 2048 }) : (fallback ?? "");
    const result = await untilRedirect(() =>
      updateProfile(
        null,
        formData({
          display_name: field("displayName", current?.display_name),
          username: field("username", current?.username),
          bio: field("bio", current?.bio),
          ministry_name: field("ministryName", current?.ministry_name),
          website_url: field("websiteUrl", current?.website_url),
          avatar_url: field("avatarUrl", current?.avatar_url),
          profile_private: (
            "profilePrivate" in args ? bool(args, "profilePrivate") : current?.profile_private
          )
            ? "on"
            : "",
        })
      )
    );
    if (result && "redirectTo" in result) return { success: true, profile: await getProfile(userId) };
    return result ?? { error: "Could not save profile." };
  },

  async follow(args) {
    const userId = str(args, "userId", { required: true, max: 64 });
    return bool(args, "follow") ? followUser(userId) : unfollowUser(userId);
  },

  async "account.delete"(args) {
    const result = await untilRedirect(() =>
      deleteCurrentUser(
        formData({
          confirm_text: str(args, "confirmText"),
          current_password: typeof args.password === "string" ? args.password : "",
        })
      )
    );
    return "redirectTo" in result ? { success: true } : result;
  },
};
