import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { LandingFeedItem } from "@/actions/landing";
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
      className="container mx-auto max-w-6xl px-4 sm:px-5 py-10 sm:py-12"
      aria-labelledby="landing-featured-heading"
    >
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <h2 id="landing-featured-heading" className="btw-overline tracking-[0.14em]">
          Featured
        </h2>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 3).map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <p className="text-xs font-medium text-muted-foreground">{item.channelTitle}</p>
              <h3
                className={cn(
                  displayFontClassName,
                  "mt-2 text-xl font-normal leading-snug text-foreground group-hover:text-primary transition-colors text-balance"
                )}
              >
                {item.title}
              </h3>
              {item.bodySnippet ? (
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {item.bodySnippet}
                </p>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary">
                Read more
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
