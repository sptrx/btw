import { describe, expect, it } from "vitest";
import { POST_PROMPTS } from "@/lib/post-prompts";
import { isSharingType } from "@/lib/sharing-types";

describe("post prompts", () => {
  const all = Object.entries(POST_PROMPTS).flatMap(([type, prompts]) =>
    (prompts ?? []).map((p) => ({ type, ...p }))
  );

  it("only targets real sharing types", () => {
    for (const key of Object.keys(POST_PROMPTS)) expect(isSharingType(key)).toBe(true);
  });

  it("never offers prompts for the prayer flow, which has its own form", () => {
    expect(POST_PROMPTS.prayer_request).toBeUndefined();
  });

  it("has unique ids and non-empty titles", () => {
    const ids = all.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of all) expect(p.title.trim().length).toBeGreaterThan(5);
  });

  it("keeps titles short enough to work as chips and as post titles", () => {
    for (const p of all) expect(p.title.length).toBeLessThanOrEqual(80);
  });
});
