const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i;

export type PostMedia = { url: string; type: string };

export type PostPoster = {
  src: string | null;
  kind: "image" | "video";
};

/** Minutes to read, or null when the text is too short to bother labeling. */
export function readingMinutes(text: string | null | undefined): number | null {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length < 40) return null;
  return Math.max(1, Math.round(words.length / 200));
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] ?? null;
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
      return u.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

function isVideoItem(item: PostMedia): boolean {
  const type = item.type.toLowerCase();
  if (type.startsWith("video")) return true;
  return /youtu\.be|youtube\.com|vimeo\.com/i.test(item.url);
}

/**
 * A still for the feed card: the first image, a YouTube poster, or the
 * channel cover when the post is a video without its own still.
 */
export function postPoster(
  media: PostMedia[] | null | undefined,
  options: { contentType?: string | null; channelCoverUrl?: string | null } = {}
): PostPoster | null {
  const items = media ?? [];
  for (const item of items) {
    const type = item.type.toLowerCase();
    if ((type.startsWith("image") || IMAGE_EXT.test(item.url)) && item.url.trim()) {
      return { src: item.url.trim(), kind: "image" };
    }
  }
  for (const item of items) {
    const id = youtubeId(item.url);
    if (id) return { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, kind: "video" };
  }
  const video =
    options.contentType === "video" || items.some((item) => isVideoItem(item));
  if (!video) return null;
  const cover = options.channelCoverUrl?.trim();
  return { src: cover || null, kind: "video" };
}
