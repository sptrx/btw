/** Shared profile field helpers (client + server safe). */

/** Minimal author shape attached to channels, posts, comments, etc. */
export type ProfileNameSnippet = {
  display_name?: string | null;
  country_code?: string | null;
} | null;

export type ProfilePublicFields = {
  id: string;
  username?: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country_code?: string | null;
  ministry_name: string | null;
  website_url: string | null;
  role?: string | null;
  created_at?: string;
  profile_private?: boolean;
};

export function normalizeOptionalText(value: FormDataEntryValue | null, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

/** Accept bare domains or social handles paths; returns null when invalid. */
export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function websiteLinkLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    return host + (parsed.pathname.length > 1 ? parsed.pathname : "");
  } catch {
    return url;
  }
}
