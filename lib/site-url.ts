/** Canonical public origin (no trailing slash). Override with NEXT_PUBLIC_SITE_URL for previews. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://believetheworks.org";
  return raw.replace(/\/+$/, "");
}
