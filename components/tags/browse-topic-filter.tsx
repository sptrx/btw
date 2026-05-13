"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Tag = { id: string; slug: string; label: string };

type Props = {
  tags: Tag[];
};

/**
 * Horizontal scrollable row of topic pills used at the top of `/channel/browse`.
 * Mirrors the homepage feed's URL-sync pattern: clicking a pill calls
 * `router.replace` and preserves any other query params (e.g. `?q=`).
 * "All" clears the `topic` param.
 */
export function BrowseTopicFilter({ tags }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("topic");

  const setTopic = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!slug) params.delete("topic");
      else params.set("topic", slug);
      const qs = params.toString();
      router.replace(qs ? `/channel/browse?${qs}` : "/channel/browse", { scroll: false });
    },
    [router, searchParams]
  );

  if (tags.length === 0) return null;

  return (
    <div
      className="mb-6 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:thin]"
      role="tablist"
      aria-label="Filter channels by topic"
    >
      <div className="flex gap-2 whitespace-nowrap">
        <button
          type="button"
          role="tab"
          aria-selected={!activeSlug}
          onClick={() => setTopic(null)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            !activeSlug
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All
        </button>
        {tags.map((tag) => {
          const isActive = activeSlug === tag.slug;
          return (
            <button
              key={tag.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTopic(tag.slug)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
