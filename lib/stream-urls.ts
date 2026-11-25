// Browser-safe helpers (no Node imports). Needs NEXT_PUBLIC_STREAM_CUSTOMER_CODE at build time.

/** Stream player URL (iframe). Needs STREAM_CUSTOMER_CODE, e.g. "abc123xyz". */
export function streamPlayerUrl(uid: string, opts: { autoplay?: boolean } = {}): string | null {
  const code = process.env.NEXT_PUBLIC_STREAM_CUSTOMER_CODE?.trim();
  if (!code) return null;
  const q = new URLSearchParams({
    muted: "true",
    loop: "true",
    preload: "auto",
    letterboxColor: "transparent",
    ...(opts.autoplay ? { autoplay: "true" } : {}),
  });
  return `https://customer-${code}.cloudflarestream.com/${uid}/iframe?${q.toString()}`;
}

export function streamThumbnailUrl(uid: string): string | null {
  const code = process.env.NEXT_PUBLIC_STREAM_CUSTOMER_CODE?.trim();
  if (!code) return null;
  return `https://customer-${code}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?time=1s&height=720`;
}
