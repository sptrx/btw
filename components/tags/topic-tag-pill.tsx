"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Calm/muted pill matching the existing visual language (used on channel and
 * homepage feed cards). When `asLink` is true the pill navigates to the
 * /channel/browse view filtered to that tag's slug.
 *
 * Implementation note: channel cards wrap their entire surface in a parent
 * `<Link>` (`InteractiveLinkCard`), so a nested `<a>` here would be invalid
 * HTML. We render a `<button>` and navigate via `useRouter` so the pill works
 * inside a parent link without producing nested anchors. `stopPropagation` on
 * the click handler prevents the outer card link from also navigating.
 */
type Props = {
  tag: { slug: string; label: string };
  asLink?: boolean;
  className?: string;
};

const BASE_PILL =
  "inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground";

export function TopicTagPill({ tag, asLink = false, className }: Props) {
  const router = useRouter();
  if (!asLink) {
    return <span className={cn(BASE_PILL, className)}>{tag.label}</span>;
  }
  const href = `/channel/browse?topic=${encodeURIComponent(tag.slug)}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        router.push(href);
      }}
      className={cn(
        BASE_PILL,
        "transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      aria-label={`Browse channels tagged ${tag.label}`}
    >
      {tag.label}
    </button>
  );
}

/**
 * Plain (non-card) variant that's safe to render outside of a parent `<Link>`.
 * Kept exported for the post-detail page or any other future surface that
 * doesn't have the nested-anchor problem.
 */
export function TopicTagPillLink({
  tag,
  className,
}: {
  tag: { slug: string; label: string };
  className?: string;
}) {
  const href = `/channel/browse?topic=${encodeURIComponent(tag.slug)}`;
  return (
    <Link
      href={href}
      className={cn(
        BASE_PILL,
        "transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {tag.label}
    </Link>
  );
}
