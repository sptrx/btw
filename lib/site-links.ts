/** Shared marketing / footer navigation. */
export const siteFooterTagline =
  "An AI‑powered Gospel initiative by Believe The Works nonprofit organization, advancing the Gospel for the digital age.";

export const bibleQaPoweredByLine =
  "Bible Q&A is powered by xgesis.ai — an AI Scripture engine available for integration on Christian platforms.";

export const footerNavLinks = [
  { href: "/explore", label: "Explore faith" },
  { href: "/about", label: "About" },
  { href: "/donate", label: "Get involved — Donate" },
  { href: "/contact", label: "Contact us" },
] as const;

export const footerLegalLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/community-guidelines", label: "Community guidelines" },
  { href: "/legal/content-disclaimer", label: "Content disclaimer" },
] as const;

/** Optional external donation URL (e.g. PayPal, church giving page). */
export function donateUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_DONATE_URL?.trim();
  return url && url.startsWith("http") ? url : null;
}
