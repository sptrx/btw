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

/** Direct link to public /ask without SSO (legacy; default off when SSO nav is on). */
export function showBibleAiPublicNav(): boolean {
  const explicit = process.env.NEXT_PUBLIC_BIBLE_AI_NAV?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  if (showBibleAiSsoNav()) return false;
  return process.env.NODE_ENV !== "production";
}

/**
 * SSO handoff via /api/bible-ai/sso (default on).
 * BIBLE_AI_HANDOFF_SECRET is server-only — do not use it here; the SSO route validates it.
 * Set NEXT_PUBLIC_BIBLE_AI_SSO=false to hide the nav link.
 */
export function showBibleAiSsoNav(): boolean {
  const explicit = process.env.NEXT_PUBLIC_BIBLE_AI_SSO?.trim().toLowerCase();
  if (explicit === "false") return false;
  if (explicit === "true") return true;
  return true;
}

/** Partner id xgesis uses for BTW-sourced sessions. */
export const BTW_XGESIS_PARTNER_ID = "believetheworks";

/** Relative URL on BTW that mints handoff and redirects to xgesis.ai. */
export function bibleAiSsoPath(
  next = "/ask",
  partner = BTW_XGESIS_PARTNER_ID,
): string {
  const params = new URLSearchParams({ next });
  if (partner.trim()) {
    params.set("partner", partner.trim().toLowerCase());
  }
  return `/api/bible-ai/sso?${params.toString()}`;
}

export const BIBLE_QA_NAV_DESCRIPTION = "Powered by xgesis.ai" as const;

export type BibleAiNavLink = {
  href: string;
  label: "Bible Q&A";
  description: typeof BIBLE_QA_NAV_DESCRIPTION;
  external: boolean;
};

/** On-site Bible Q&A for seekers (anonymous-friendly). */
export function bibleAskPagePath(): string {
  return "/ask";
}

/** Resolve header nav link on the server so every page gets the same href. */
export function resolveBibleAiNavLink(isAuthenticated = false): BibleAiNavLink | null {
  if (isAuthenticated && showBibleAiSsoNav()) {
    return {
      href: bibleAiSsoPath("/ask"),
      label: "Bible Q&A",
      description: BIBLE_QA_NAV_DESCRIPTION,
      external: false,
    };
  }
  if (isScriptureGuideAvailableOnBtw()) {
    return {
      href: bibleAskPagePath(),
      label: "Bible Q&A",
      description: BIBLE_QA_NAV_DESCRIPTION,
      external: false,
    };
  }
  if (showBibleAiPublicNav()) {
    return {
      href: bibleAiPublicAskUrl(),
      label: "Bible Q&A",
      description: BIBLE_QA_NAV_DESCRIPTION,
      external: true,
    };
  }
  return null;
}

/** True when BTW can proxy questions to bible-ai (server env configured). */
export function isScriptureGuideAvailableOnBtw(): boolean {
  const env = (process.env.BIBLE_AI_BASE_URL ?? "").trim();
  if (env) return true;
  return process.env.NODE_ENV !== "production";
}
