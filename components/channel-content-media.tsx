/**
 * Renders media attached to channel content.
 * Direct file URLs use <img> / <video>. YouTube/Vimeo and similar need embeds — <video> does not play those URLs.
 */

function parseYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ?? null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] ?? null;
      }
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2] ?? null;
      }
      const v = u.searchParams.get("v");
      if (v) return v;
    }
  } catch {
    return null;
  }
  return null;
}

function parseVimeoVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (host === "player.vimeo.com" && parts[0] === "video") return parts[1] ?? null;
      return parts[0] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function isLikelyDirectVideoFile(url: string): boolean {
  const lower = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|ogg|mov)(\b|$)/i.test(lower);
}

type Item = { url: string; type: string };

export function ChannelContentMedia({ items }: { items: Item[] }) {
  const list = items.filter((m) => m?.url && String(m.url).trim());

  if (list.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {list.map((m, i) => (
        <MediaItem key={`${m.url}-${i}`} item={m} />
      ))}
    </div>
  );
}

function MediaItem({ item }: { item: Item }) {
  const url = item.url.trim();
  const isImage = item.type === "image";

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="max-w-full rounded-lg border border-border" loading="lazy" />
    );
  }

  const yt = parseYouTubeVideoId(url);
  if (yt) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border border-border aspect-video bg-muted">
        <iframe
          title="YouTube video"
          src={`https://www.youtube-nocookie.com/embed/${yt}`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  const vm = parseVimeoVideoId(url);
  if (vm) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border border-border aspect-video bg-muted">
        <iframe
          title="Vimeo video"
          src={`https://player.vimeo.com/video/${vm}`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isLikelyDirectVideoFile(url) || url.startsWith("blob:") || url.startsWith("data:")) {
    return <video src={url} controls className="max-w-full rounded-lg border border-border" playsInline />;
  }

  /** e.g. Loom, Wistia, or non-standard URLs — <video> won’t play these */
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground mb-2">
        This URL isn’t a direct video file or a supported embed (YouTube / Vimeo). Open it in a new tab, or edit
        the post and use a watch link like{" "}
        <span className="font-mono text-xs">youtube.com/watch?v=…</span> or a direct .mp4 link.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-primary break-all underline-offset-4 hover:underline"
      >
        {url}
      </a>
    </div>
  );
}
