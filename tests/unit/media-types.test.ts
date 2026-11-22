import { describe, expect, it } from "vitest";
import { bytesMatchMime, isAllowedImageType, isAllowedMediaType } from "@/lib/media-types";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
const ascii = (s: string) => Array.from(s).map((c) => c.charCodeAt(0));

describe("isAllowedMediaType", () => {
  it("accepts the supported images and videos", () => {
    for (const t of ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"]) {
      expect(isAllowedMediaType(t)).toBe(true);
    }
  });

  it("rejects SVG and other types", () => {
    for (const t of ["image/svg+xml", "text/html", "application/pdf", "image/", "video/x-flv", "application/octet-stream", ""]) {
      expect(isAllowedMediaType(t)).toBe(false);
    }
  });

  it("is case-insensitive", () => {
    expect(isAllowedMediaType("IMAGE/PNG")).toBe(true);
  });

  it("only allows images for avatars", () => {
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("video/mp4")).toBe(false);
  });
});

describe("bytesMatchMime", () => {
  it("accepts real signatures", () => {
    expect(bytesMatchMime(bytes(0xff, 0xd8, 0xff, 0xe0), "image/jpeg")).toBe(true);
    expect(bytesMatchMime(bytes(0x89, 0x50, 0x4e, 0x47), "image/png")).toBe(true);
    expect(bytesMatchMime(bytes(...ascii("GIF89a")), "image/gif")).toBe(true);
    expect(bytesMatchMime(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")), "image/webp")).toBe(true);
    expect(bytesMatchMime(bytes(0, 0, 0, 0x18, ...ascii("ftypmp42")), "video/mp4")).toBe(true);
    expect(bytesMatchMime(bytes(0x1a, 0x45, 0xdf, 0xa3), "video/webm")).toBe(true);
  });

  it("rejects HTML or SVG renamed to an image type", () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    for (const mime of ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]) {
      expect(bytesMatchMime(html, mime)).toBe(false);
      expect(bytesMatchMime(svg, mime)).toBe(false);
    }
  });

  it("rejects a mismatched but valid signature", () => {
    expect(bytesMatchMime(bytes(0x89, 0x50, 0x4e, 0x47), "image/jpeg")).toBe(false);
  });

  it("rejects unknown types and empty files", () => {
    expect(bytesMatchMime(bytes(0xff, 0xd8, 0xff), "image/svg+xml")).toBe(false);
    expect(bytesMatchMime(new Uint8Array(0), "image/png")).toBe(false);
  });
});
