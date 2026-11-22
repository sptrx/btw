import Link from "next/link";
import { Play } from "lucide-react";
import type { PostPoster as Poster } from "@/lib/post-card";

type Props = {
  poster: Poster;
  href: string;
  title: string;
};

export function PostPoster({ poster, href, title }: Props) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      className="mt-3 block overflow-hidden rounded-xl border border-border/70 bg-muted/40"
    >
      <span className="relative block aspect-video">
        {poster.src ? (
          // External posters (YouTube, member uploads) are not in the image optimizer allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-stone-800 to-stone-950" />
        )}
        {poster.kind === "video" ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex size-12 items-center justify-center rounded-full bg-background/92 text-foreground shadow-md">
              <Play className="size-5 fill-current" aria-hidden />
            </span>
            <span className="sr-only">Play {title}</span>
          </span>
        ) : (
          <span className="sr-only">{title}</span>
        )}
      </span>
    </Link>
  );
}
