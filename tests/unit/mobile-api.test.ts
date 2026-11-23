import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  createPrayerRequest: vi.fn(),
  deleteCurrentUser: vi.fn(),
  getCommunityFeedPage: vi.fn(),
  setPostReaction: vi.fn(),
  clearPostReaction: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/actions", () => ({}));
vi.mock("@/actions/auth", () => ({ deleteCurrentUser: actions.deleteCurrentUser }));
vi.mock("@/actions/channels", () => ({}));
vi.mock("@/actions/feed", () => ({ getCommunityFeedPage: actions.getCommunityFeedPage }));
vi.mock("@/actions/follows", () => ({}));
vi.mock("@/actions/prayer", () => ({ createPrayerRequest: actions.createPrayerRequest }));
vi.mock("@/actions/reactions", () => ({
  setPostReaction: actions.setPostReaction,
  clearPostReaction: actions.clearPostReaction,
}));
vi.mock("@/lib/bible-ai", () => ({
  isScriptureGuideConfigured: () => false,
  fetchBibleTranslations: vi.fn(),
  fetchBibleBooks: vi.fn(),
  fetchBibleChapter: vi.fn(),
}));

import { MobileApiError, mobileHandlers, parseMediaItems, redirectTarget } from "@/lib/mobile-api";

function nextRedirect(url: string) {
  return Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${url};307;` });
}

beforeEach(() => vi.clearAllMocks());

describe("redirectTarget", () => {
  it("reads the URL from a Next.js redirect error", () => {
    expect(redirectTarget(nextRedirect("/prayer/abc"))).toBe("/prayer/abc");
  });

  it("ignores other errors", () => {
    expect(redirectTarget(new Error("boom"))).toBeNull();
    expect(redirectTarget(null)).toBeNull();
  });
});

describe("parseMediaItems", () => {
  it("accepts arrays and JSON strings, drops items without a url", () => {
    expect(parseMediaItems([{ url: "https://a", type: "video" }, { type: "x" }])).toEqual([
      { url: "https://a", type: "video" },
    ]);
    expect(parseMediaItems('[{"url":"https://b"}]')).toEqual([{ url: "https://b", type: "link" }]);
    expect(parseMediaItems("not json")).toEqual([]);
  });
});

describe("mobile handlers", () => {
  it("returns the new prayer id when the action redirects to it", async () => {
    actions.createPrayerRequest.mockRejectedValue(nextRedirect("/prayer/p-1"));
    await expect(
      mobileHandlers["prayer.create"]({ title: "T", body: "B", isAnonymous: true })
    ).resolves.toEqual({ success: true, id: "p-1" });

    const fd = actions.createPrayerRequest.mock.calls[0][0] as FormData;
    expect(fd.get("is_anonymous")).toBe("on");
    expect(fd.get("accepted_disclaimer")).toBe("");
  });

  it("treats a redirect to login as signed out", async () => {
    actions.createPrayerRequest.mockRejectedValue(nextRedirect("/auth/login?next=/prayer/new"));
    await expect(mobileHandlers["prayer.create"]({ title: "T", body: "B" })).rejects.toMatchObject(
      { status: 401 }
    );
  });

  it("passes pending-review results through", async () => {
    const pending = { success: true, pendingReview: true, message: "In review" };
    actions.createPrayerRequest.mockResolvedValue(pending);
    await expect(mobileHandlers["prayer.create"]({ title: "T", body: "B" })).resolves.toBe(pending);
  });

  it("rejects unknown feed filters and bad cursors", async () => {
    await expect(mobileHandlers.feed({ filter: "nope" })).rejects.toBeInstanceOf(MobileApiError);

    actions.getCommunityFeedPage.mockResolvedValue({ items: [], nextCursor: null });
    await mobileHandlers.feed({ filter: "prayer", cursor: { createdAt: 1, id: "x" } });
    expect(actions.getCommunityFeedPage).toHaveBeenCalledWith("prayer", 20, null);
  });

  it("validates reactions and clears when none is given", async () => {
    await expect(
      mobileHandlers.react({ postId: "1", postKind: "topic_content", reaction: "like" })
    ).rejects.toBeInstanceOf(MobileApiError);
    await expect(
      mobileHandlers.react({ postId: "1", postKind: "users", reaction: "amen" })
    ).rejects.toBeInstanceOf(MobileApiError);

    await mobileHandlers.react({ postId: "1", postKind: "prayer_request" });
    expect(actions.clearPostReaction).toHaveBeenCalledWith("1", "prayer_request");
    await mobileHandlers.react({ postId: "1", postKind: "topic_content", reaction: "amen" });
    expect(actions.setPostReaction).toHaveBeenCalledWith("1", "topic_content", "amen");
  });

  it("reports account deletion as success once the action redirects", async () => {
    actions.deleteCurrentUser.mockRejectedValue(nextRedirect("/auth/login?message=account_deleted"));
    await expect(
      mobileHandlers["account.delete"]({ confirmText: "DELETE", password: " pw " })
    ).resolves.toEqual({ success: true });
    const fd = actions.deleteCurrentUser.mock.calls[0][0] as FormData;
    expect(fd.get("current_password")).toBe(" pw ");
  });
});
