import "server-only";

import { SignJWT } from "jose";

const HANDOFF_ISSUER = "btw";
const HANDOFF_AUDIENCE = "xgesis.ai";

function handoffSecret(): string {
  const s = (process.env.BIBLE_AI_HANDOFF_SECRET ?? "").trim();
  if (!s) {
    throw new Error(
      "BIBLE_AI_HANDOFF_SECRET is not set. Use the same value on bible-ai and BTW.",
    );
  }
  return s;
}

export function isBibleAiHandoffConfigured(): boolean {
  return !!(process.env.BIBLE_AI_HANDOFF_SECRET ?? "").trim();
}

export type HandoffUser = {
  userId: string;
  email?: string | null;
  name?: string | null;
  partner?: string | null;
};

export async function createBibleAiHandoffToken(user: HandoffUser): Promise<string> {
  const jti = crypto.randomUUID();
  const ttlSec = Number(process.env.BIBLE_AI_HANDOFF_TTL_SEC ?? 300);
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const partner = user.partner?.trim().toLowerCase();

  return new SignJWT({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    partner: partner || undefined,
    typ: "handoff",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(HANDOFF_ISSUER)
    .setAudience(HANDOFF_AUDIENCE)
    .setSubject(user.userId)
    .setJti(jti)
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(new TextEncoder().encode(handoffSecret()));
}

export function bibleAiHandoffUrl(
  token: string,
  next = "/ask",
  partner?: string | null,
): string {
  const base = (
    process.env.BIBLE_AI_PUBLIC_ORIGIN ??
    process.env.BIBLE_AI_BASE_URL ??
    "http://localhost:3040"
  )
    .replace(/\/$/, "")
    .trim();

  const path = next.startsWith("/") && !next.startsWith("//") ? next : "/ask";
  const url = new URL("/auth/handoff", base);
  url.searchParams.set("token", token);
  url.searchParams.set("next", path);
  const partnerId = partner?.trim().toLowerCase();
  if (partnerId) {
    url.searchParams.set("partner", partnerId);
  }
  return url.toString();
}
