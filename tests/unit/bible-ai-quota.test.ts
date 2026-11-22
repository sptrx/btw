import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const createAdminClient = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

import { bibleAiDailyLimit, checkAndIncrementBibleAiQuota } from "@/lib/bible-ai-quota";

describe("bibleAiDailyLimit", () => {
  beforeEach(() => {
    delete process.env.BTW_BIBLE_AI_DAILY_LIMIT;
  });

  it("defaults to 30 and ignores bad values", () => {
    expect(bibleAiDailyLimit()).toBe(30);
    for (const bad of ["abc", "0", "-5", ""]) {
      process.env.BTW_BIBLE_AI_DAILY_LIMIT = bad;
      expect(bibleAiDailyLimit()).toBe(30);
    }
  });

  it("honours a valid override", () => {
    process.env.BTW_BIBLE_AI_DAILY_LIMIT = "12";
    expect(bibleAiDailyLimit()).toBe(12);
  });
});

describe("checkAndIncrementBibleAiQuota", () => {
  beforeEach(() => {
    rpc.mockReset();
    createAdminClient.mockReset();
    createAdminClient.mockReturnValue({ rpc });
    delete process.env.BTW_BIBLE_AI_DAILY_LIMIT;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("allows a request and reports what remains", async () => {
    rpc.mockResolvedValue({ data: { allowed: true, remaining: 29 }, error: null });
    const res = await checkAndIncrementBibleAiQuota("user-1");
    expect(res).toEqual({ allowed: true, remaining: 29 });
    expect(rpc).toHaveBeenCalledWith("consume_bible_ai_quota", { p_user_id: "user-1", p_limit: 30 });
  });

  it("refuses once the daily limit is used", async () => {
    rpc.mockResolvedValue({ data: { allowed: false, remaining: 0 }, error: null });
    const res = await checkAndIncrementBibleAiQuota("user-1");
    expect(res.allowed).toBe(false);
    if (!res.allowed) expect(res.error).toMatch(/limit of 30/);
  });

  it("fails closed when the database call errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await checkAndIncrementBibleAiQuota("user-1");
    expect(res.allowed).toBe(false);
  });

  it("fails closed when the service role key is missing", async () => {
    createAdminClient.mockReturnValue(null);
    const res = await checkAndIncrementBibleAiQuota("user-1");
    expect(res.allowed).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
