// Browser-safe URL builders. The customer code is read on the server at request time
// (STREAM_CUSTOMER_CODE as a runtime variable) and passed down, so it needs no rebuild.

export function streamCustomerCode(): string | null {
  const code = (process.env.STREAM_CUSTOMER_CODE || process.env.NEXT_PUBLIC_STREAM_CUSTOMER_CODE || "").trim();
  return code || null;
}

/** Stream player URL (iframe) without autoplay. */
export function streamPlayerUrl(uid: string, code: string | null): string | null {
  if (!code) return null;
  const q = new URLSearchParams({
    muted: "true",
    loop: "true",
    preload: "auto",
    letterboxColor: "transparent",
  });
  return `https://customer-${code}.cloudflarestream.com/${uid}/iframe?${q.toString()}`;
}

export function streamThumbnailUrl(uid: string, code: string | null): string | null {
  if (!code) return null;
  return `https://customer-${code}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?time=1s&height=720`;
}
