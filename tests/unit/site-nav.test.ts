import { describe, expect, it } from "vitest";
import { buildSiteNav, isNavActive } from "@/lib/site-nav";

describe("buildSiteNav", () => {
  it("lists the six destinations in order", () => {
    expect(buildSiteNav(null).map((i) => i.key)).toEqual([
      "home",
      "explore",
      "channels",
      "prayer",
      "bible",
      "ask",
    ]);
  });

  it("falls back to the on-site Bible Q&A page and uses the hosted link when given", () => {
    expect(buildSiteNav(null).find((i) => i.key === "ask")).toMatchObject({ href: "/ask", external: false });
    const hosted = buildSiteNav({
      href: "https://x.test/ask",
      label: "Bible Q&A",
      external: true,
    } as unknown as Parameters<typeof buildSiteNav>[0]);
    expect(hosted.find((i) => i.key === "ask")).toMatchObject({ href: "https://x.test/ask", external: true });
  });
});

describe("isNavActive", () => {
  it("matches sections by path, not by prefix collision", () => {
    expect(isNavActive("home", "/")).toBe(true);
    expect(isNavActive("home", "/prayer")).toBe(false);
    expect(isNavActive("channels", "/channel/browse")).toBe(true);
    expect(isNavActive("channels", "/channel/my-church/content/1")).toBe(true);
    expect(isNavActive("prayer", "/prayer/abc")).toBe(true);
    expect(isNavActive("prayer", "/prayers")).toBe(false);
    expect(isNavActive("explore", "/explore")).toBe(true);
    expect(isNavActive("bible", "/bible")).toBe(true);
    expect(isNavActive("ask", "/ask")).toBe(true);
  });
});
