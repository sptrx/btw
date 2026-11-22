import { describe, expect, it } from "vitest";
import { firstImageUrl, pageMetadata, privatePageMetadata, snippet } from "@/lib/seo";

describe("snippet", () => {
  it("collapses whitespace and leaves short text alone", () => {
    expect(snippet("  a \n\n b   c ")).toBe("a b c");
  });
  it("cuts long text on a word boundary with an ellipsis", () => {
    const out = snippet("word ".repeat(100), 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/wor…$/);
  });
  it("handles empty input", () => {
    expect(snippet(null)).toBe("");
    expect(snippet(undefined)).toBe("");
  });
});

describe("firstImageUrl", () => {
  it("returns the first https image and skips video or non-https", () => {
    expect(firstImageUrl(["https://x.test/a.mp4", "http://x.test/b.jpg", "https://x.test/c.PNG?v=1"])).toBe(
      "https://x.test/c.PNG?v=1"
    );
  });
  it("returns null for non-arrays and empty lists", () => {
    expect(firstImageUrl(null)).toBeNull();
    expect(firstImageUrl([])).toBeNull();
    expect(firstImageUrl("https://x.test/a.jpg")).toBeNull();
  });
});

describe("pageMetadata", () => {
  it("falls back to the default share image and builds matching OG and Twitter tags", () => {
    const m = pageMetadata({ title: "T", description: "D", path: "/p" });
    expect(m.openGraph?.images).toEqual([{ url: "/og-default.jpg" }]);
    expect(m.twitter?.images).toEqual(["/og-default.jpg"]);
    expect(m.alternates?.canonical).toBe("/p");
    expect(m.robots).toBeUndefined();
  });
  it("uses a given image and supports noindex", () => {
    const m = pageMetadata({ title: "T", image: "https://x.test/i.jpg", noindex: true });
    expect(m.openGraph?.images).toEqual([{ url: "https://x.test/i.jpg" }]);
    expect(m.robots).toEqual({ index: false, follow: false });
  });
  it("marks private pages noindex", () => {
    expect(privatePageMetadata("Sign in").robots).toEqual({ index: false, follow: false });
  });
});
