import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStreamWebhook } from "@/lib/stream";
import { streamCustomerCode, streamHlsUrl, streamPlayerUrl, streamThumbnailUrl } from "@/lib/stream-urls";

const SECRET = "s3cret";
const sign = (body: string, time: number) =>
  `time=${time},sig1=${createHmac("sha256", SECRET).update(`${time}.${body}`).digest("hex")}`;

describe("verifyStreamWebhook", () => {
  const now = 1_700_000_000_000;
  const t = now / 1000;
  const body = '{"uid":"abc"}';

  it("accepts a valid signature", () => {
    expect(verifyStreamWebhook(body, sign(body, t), SECRET, now)).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(verifyStreamWebhook('{"uid":"evil"}', sign(body, t), SECRET, now)).toBe(false);
  });
  it("rejects a wrong secret, missing header, or empty secret", () => {
    expect(verifyStreamWebhook(body, sign(body, t), "other", now)).toBe(false);
    expect(verifyStreamWebhook(body, null, SECRET, now)).toBe(false);
    expect(verifyStreamWebhook(body, sign(body, t), "", now)).toBe(false);
  });
  it("rejects a stale timestamp", () => {
    expect(verifyStreamWebhook(body, sign(body, t - 600), SECRET, now)).toBe(false);
  });
});

describe("stream urls", () => {
  it("returns null without a customer code", () => {
    expect(streamPlayerUrl("abc", null)).toBeNull();
    expect(streamThumbnailUrl("abc", null)).toBeNull();
  });
  it("builds iframe and thumbnail urls", () => {
    expect(streamPlayerUrl("abc", "xyz")).toContain("customer-xyz.cloudflarestream.com/abc/iframe");
    expect(streamThumbnailUrl("abc", "xyz")).toContain("/abc/thumbnails/thumbnail.jpg");
  });
  it("reads the code at runtime", () => {
    process.env.STREAM_CUSTOMER_CODE = " run123 ";
    expect(streamCustomerCode()).toBe("run123");
    delete process.env.STREAM_CUSTOMER_CODE;
  });
});

describe("streamHlsUrl", () => {
  it("returns null without a customer code", () => {
    expect(streamHlsUrl("abc", null)).toBeNull();
  });
  it("points at the HLS manifest the app's player needs", () => {
    expect(streamHlsUrl("abc", "xyz")).toBe(
      "https://customer-xyz.cloudflarestream.com/abc/manifest/video.m3u8"
    );
  });
});
