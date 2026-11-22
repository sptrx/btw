import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";

export const DEFAULT_OG_IMAGE = "/og-default.jpg";
export const SITE_NAME = "Believe The Works";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i;

/** Collapse whitespace and cut to `max` characters on a word boundary. */
export function snippet(text: string | null | undefined, max = 155): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** First usable image URL from a `media_urls` value (string list), else null. */
export function firstImageUrl(mediaUrls: unknown): string | null {
  if (!Array.isArray(mediaUrls)) return null;
  for (const m of mediaUrls) {
    if (typeof m === "string" && /^https:\/\//i.test(m) && IMAGE_EXT.test(m)) return m;
  }
  return null;
}

type PageMetaInput = {
  title: string;
  description?: string | null;
  /** Site-relative path, e.g. /channel/my-church */
  path?: string;
  /** Absolute https URL or a site-relative path */
  image?: string | null;
  /** Keep out of search results (private, pending or personal pages) */
  noindex?: boolean;
  type?: "website" | "article";
};

/**
 * Page metadata with matching Open Graph and Twitter tags. The `title` is the
 * short page title; the root layout template appends " | BTW".
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noindex,
  type = "website",
}: PageMetaInput): Metadata {
  const desc = snippet(description) || undefined;
  const img = image || DEFAULT_OG_IMAGE;
  const url = path ? `${siteUrl()}${path}` : undefined;
  return {
    title,
    description: desc,
    alternates: path ? { canonical: path } : undefined,
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: img }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [img],
    },
  };
}

/** For private screens (sign-in, account, forms). */
export function privatePageMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}
