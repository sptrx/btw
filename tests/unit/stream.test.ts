import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStreamWebhook } from "@/lib/stream";
import { streamPlayerUrl } from "@/lib/stream-urls";

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

describe("streamPlayerUrl", () => {
  it("returns null without a customer code", () => {
    delete process.env.NEXT_PUBLIC_STREAM_CUSTOMER_CODE;
    expect(streamPlayerUrl("abc")).toBeNull();
  });
  it("builds an iframe url", () => {
    process.env.NEXT_PUBLIC_STREAM_CUSTOMER_CODE = "xyz";
    expect(streamPlayerUrl("abc", { autoplay: true })).toContain("customer-xyz.cloudflarestream.com/abc/iframe");
  });
});
