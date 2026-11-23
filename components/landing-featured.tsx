import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { LandingFeedItem } from "@/actions/landing";
import { postPoster } from "@/lib/post-card";
import { cn } from "@/lib/utils";

type Props = {
  items: LandingFeedItem[];
  displayFontClassName: string;
};

/**
 * Hand-picked posts, chosen by the site team (topic_content.is_featured).
 * Renders nothing until at least one post is featured, so the homepage never
 * shows an empty "Featured" shell.
 */
export function LandingFeatured({ items, displayFontClassName }: Props) {
  if (items.length === 0) return null;

  return (
    <section
      className="py-2"
      aria-labelledby="landing-featured-heading"
    >
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <h2 id="landing-featured-heading" className="btw-overline tracking-[0.14em]">
          Featured
        </h2>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 3).map((item) => {
          const poster = postPoster(item.mediaItems, {
            contentType: item.type,
            channelCoverUrl: item.channelCoverUrl,
          });
          return (
          <li key={item.id}>
            <Link
              href={item.href}
              transitionTypes={["nav-forward"]}
              className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {poster?.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster.src} alt="" className="mb-4 aspect-video w-full rounded-xl object-cover" />
              ) : null}
              <p className="text-xs font-medium text-muted-foreground">{item.channelTitle}</p>
              <h3
                className={cn(
                  displayFontClassName,
                  "mt-2 text-xl leading-snug text-foreground group-hover:text-primary transition-colors text-balance"
                )}
              >
                {item.title}
              </h3>
              {item.bodySnippet ? (
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {item.bodySnippet}
                </p>
              ) : null}
              <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
                <span className="inline-flex items-center gap-3 text-xs text-muted-foreground">
                  {item.readMinutes ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden />
                      {item.readMinutes} min
                    </span>
                  ) : null}
                  {item.reactionCount > 0 ? (
                    <span className="tabular-nums">{item.reactionCount} reactions</span>
                  ) : null}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                  Read more
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </span>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
