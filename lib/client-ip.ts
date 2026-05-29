import "server-only";

import { createHash } from "crypto";
import type { NextRequest } from "next/server";

/** Best-effort client IP for rate limiting (Cloudflare / reverse proxies). */
export function getClientIpFromRequest(req: NextRequest): string {
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

export function hashIpForStorage(ip: string): string {
  const salt = (process.env.BTW_ANON_ASK_IP_SALT ?? "btw-anon-ask").trim();
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
