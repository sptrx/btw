/**
 * Hosted Scripture Chat (bible-ai on Cloudflare Pages).
 * Override with BIBLE_AI_BASE_URL / NEXT_PUBLIC_BIBLE_AI_URL for staging or self-hosted installs.
 */
export const BIBLE_AI_PRODUCTION_ORIGIN = "https://bible-ai-c3q.pages.dev";

export function bibleAiPublicAskUrl(): string {
  const env = process.env.NEXT_PUBLIC_BIBLE_AI_URL?.trim();
  if (env) return env;
  if (process.env.NODE_ENV === "production") {
    return `${BIBLE_AI_PRODUCTION_ORIGIN}/ask`;
  }
  return "http://localhost:3040/ask";
}

export function bibleAiServerBaseUrl(): string {
  const env = (process.env.BIBLE_AI_BASE_URL ?? "").replace(/\/$/, "").trim();
  if (env) return env;
  if (process.env.NODE_ENV === "production") {
    return BIBLE_AI_PRODUCTION_ORIGIN;
  }
  return "";
}
