/**
 * HTTP smoke tests against a running copy of the site.
 *
 *   SMOKE_BASE_URL=http://localhost:3100 npm run test:smoke
 *
 * Skipped when SMOKE_BASE_URL is not set, so plain `npm test` needs no server.
 * CI builds the app, starts it, and runs these. They only touch public pages and
 * unauthenticated requests, so no real accounts or secrets are needed.
 */
import { describe, expect, it } from "vitest";

const BASE = (process.env.SMOKE_BASE_URL ?? "").replace(/\/$/, "");

const get = (path: string, init: RequestInit = {}) =>
  fetch(`${BASE}${path}`, { redirect: "manual", ...init });

describe.skipIf(!BASE)("smoke: public pages", () => {
  it("serves the homepage", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    expect(await res.text()).toContain("Share your witness");
  });

  it("serves the invite page for churches", async () => {
    const res = await get("/invite");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Bring your church");
    expect(html).toContain("/auth/signup");
  });

  it.each(["/about", "/explore", "/contact", "/legal/terms", "/legal/community-guidelines", "/auth/login", "/auth/signup"])(
    "serves %s without signing in",
    async (path) => {
      const res = await get(path);
      expect(res.status).toBe(200);
    }
  );

  it("serves a real robots.txt that points to the sitemap", async () => {
    const res = await get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);
    const text = await res.text();
    expect(text).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
    expect(text).toContain("Disallow: /api/");
  });

  it("serves a real XML sitemap that lists the invite page", async () => {
    const res = await get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/xml/);
    const xml = await res.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("/invite</loc>");
  });
});

describe.skipIf(!BASE)("smoke: access control", () => {
  it.each(["/dashboard", "/dashboard/settings", "/channel/new", "/prayer/new"])(
    "sends signed-out visitors from %s to the login page",
    async (path) => {
      const res = await get(path);
      expect([307, 308]).toContain(res.status);
      const location = new URL(res.headers.get("location") ?? "", BASE);
      expect(location.pathname).toBe("/auth/login");
      expect(location.searchParams.get("next")).toBe(path);
    }
  );

  it("keeps the Bible Q&A sign-in redirect on this site", async () => {
    const res = await get("/api/bible-ai/sso?next=//evil.example.com/x&partner=btw");
    expect([307, 308]).toContain(res.status);
    const location = new URL(res.headers.get("location") ?? "", BASE);
    expect(location.origin).toBe(new URL(BASE).origin);
    expect(location.pathname).toBe("/auth/login");
    expect(location.searchParams.get("next") ?? "").not.toMatch(/evil/);
  });

  it.each(["/api/media/presign", "/api/media/upload"])(
    "never accepts an anonymous upload at %s",
    async (path) => {
      const res = await get(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channelId: "00000000-0000-0000-0000-000000000000",
          filename: "x.png",
          contentType: "image/png",
          contentLength: 100,
        }),
      });
      // 401 when uploads are configured, 503 (or 400 for the multipart route) when not.
      expect([400, 401, 503]).toContain(res.status);
    }
  );

  it("rejects SVG uploads before checking anything else", async () => {
    const res = await get("/api/media/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "00000000-0000-0000-0000-000000000000",
        filename: "x.svg",
        contentType: "image/svg+xml",
        contentLength: 100,
      }),
    });
    // Unconfigured servers answer 503 first; configured ones must refuse the type.
    expect([400, 503]).toContain(res.status);
  });
});
