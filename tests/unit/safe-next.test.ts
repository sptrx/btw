import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-next";

const FALLBACK = "/fallback";

describe("safeNextPath", () => {
  it("keeps same-site paths, queries and hashes", () => {
    expect(safeNextPath("/ask", FALLBACK)).toBe("/ask");
    expect(safeNextPath("/channel/x/content/1?updated=1#c", FALLBACK)).toBe(
      "/channel/x/content/1?updated=1#c"
    );
    expect(safeNextPath("/api/bible-ai/sso?next=%2Fask&partner=btw", FALLBACK)).toBe(
      "/api/bible-ai/sso?next=%2Fask&partner=btw"
    );
  });

  it.each([
    ["protocol-relative URL", "//evil.com"],
    ["backslash trick", "/\\evil.com"],
    ["absolute URL", "https://evil.com/path"],
    ["javascript URL", "javascript:alert(1)"],
    ["data URL", "data:text/html,<script>alert(1)</script>"],
    ["no leading slash", "evil.com"],
    ["newline injection", "/ok\nSet-Cookie: a=b"],
    ["tab inside path", "/\t/evil.com"],
  ])("rejects %s", (_name, value) => {
    expect(safeNextPath(value, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back on empty input", () => {
    expect(safeNextPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath("", FALLBACK)).toBe(FALLBACK);
  });

  it("uses the default fallback", () => {
    expect(safeNextPath("//evil.com")).toBe("/channel/browse");
  });
});
