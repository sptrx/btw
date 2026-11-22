import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approvedModerationOrFilter,
  checkFakeUserHeuristic,
  moderateContent,
} from "@/lib/moderation";
import { MODERATION_UNAVAILABLE_MESSAGE } from "@/lib/moderation-messages";

const ENV_KEYS = ["OPENROUTER_API_KEY", "GOOGLE_AI_API_KEY", "OPENAI_API_KEY", "MODERATION_SKIP"] as const;

describe("moderation helpers", () => {
  it("builds the approved-or-legacy filter", () => {
    expect(approvedModerationOrFilter()).toBe("moderation_status.eq.approved,moderation_status.is.null");
    expect(approvedModerationOrFilter("t.status")).toBe("t.status.eq.approved,t.status.is.null");
  });

  it("flags excessive posting at 20 per day", () => {
    expect(checkFakeUserHeuristic("u", 19)).toBe(false);
    expect(checkFakeUserHeuristic("u", 20)).toBe(true);
  });
});

describe("moderateContent", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects empty content", async () => {
    const res = await moderateContent("   ");
    expect(res.allowed).toBe(false);
  });

  it("blocks publishing in production when no AI provider is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await moderateContent("Praise God for his goodness");
    expect(res).toEqual({ allowed: false, reason: MODERATION_UNAVAILABLE_MESSAGE });
  });

  it("allows content without a provider only outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await moderateContent("Praise God for his goodness");
    expect(res.allowed).toBe(true);
  });

  it("does not leak provider error details to users", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-test";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.5 key=sk-or-test"))
    );
    const res = await moderateContent("A real testimony about answered prayer");
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe(MODERATION_UNAVAILABLE_MESSAGE);
    expect(res.reason).not.toMatch(/ECONNREFUSED|sk-or|10\.0\.0\.5/);
  });
});
