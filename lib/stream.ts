import { createHmac, timingSafeEqual } from "node:crypto";

/** Limits for a short. Enforced again by Cloudflare Stream (maxDurationSeconds). */
export { SHORT_CAPTION_MAX, SHORT_MAX_BYTES, SHORT_MAX_SECONDS } from "@/lib/stream-limits";
import { SHORT_MAX_SECONDS } from "@/lib/stream-limits";

const API = "https://api.cloudflare.com/client/v4";

function accountId() {
  return (process.env.STREAM_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || "").trim();
}

export function isStreamConfigured(): boolean {
  return Boolean(accountId() && process.env.STREAM_API_TOKEN?.trim());
}

type StreamEnvelope<T> = { success: boolean; result: T; errors?: { message: string }[] };

async function streamFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/accounts/${accountId()}/stream${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.STREAM_API_TOKEN?.trim()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => null)) as StreamEnvelope<T> | null;
  if (!res.ok || !json?.success) {
    throw new Error(json?.errors?.[0]?.message || `Stream request failed (${res.status}).`);
  }
  return json.result;
}

/** One-time upload URL the browser posts the file to. Stream rejects videos over the limit. */
export async function createDirectUpload(creator: string) {
  return streamFetch<{ uploadURL: string; uid: string }>("/direct_upload", {
    method: "POST",
    body: JSON.stringify({
      maxDurationSeconds: SHORT_MAX_SECONDS,
      creator,
      expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      meta: { app: "btw-shorts" },
    }),
  });
}

export type StreamVideo = {
  uid: string;
  readyToStream: boolean;
  duration: number;
  thumbnail?: string;
  status?: { state: string; errorReasonText?: string };
};

export async function getStreamVideo(uid: string) {
  return streamFetch<StreamVideo>(`/${encodeURIComponent(uid)}`);
}

export async function deleteStreamVideo(uid: string) {
  try {
    await streamFetch<unknown>(`/${encodeURIComponent(uid)}`, { method: "DELETE" });
  } catch {
    /* already gone */
  }
}

/** Verifies Stream's `Webhook-Signature: time=<unix>,sig1=<hex>` header. */
export function verifyStreamWebhook(
  rawBody: string,
  header: string | null,
  secret: string,
  now = Date.now(),
): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const time = Number(parts.time);
  const sig = parts.sig1;
  if (!Number.isFinite(time) || !sig) return false;
  if (Math.abs(now / 1000 - time) > 5 * 60) return false;
  const expected = createHmac("sha256", secret).update(`${time}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
