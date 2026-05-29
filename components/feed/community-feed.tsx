"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import {
  getCommunityFeedPage,
  type CommunityFeedCursor,
  type CommunityFeedFilter,
  type CommunityFeedGeoFilter,
  type CommunityFeedItem,
} from "@/actions/feed";
import { CommunityFeedCard } from "@/components/feed/community-feed-card";
import { Button } from "@/components/ui/button";
import { SHARING_FEED_FILTERS } from "@/lib/sharing-types";
import { cn } from "@/lib/utils";

type Props = {
  initialItems: CommunityFeedItem[];
  initialCursor: CommunityFeedCursor | null;
  initialFilter: CommunityFeedFilter;
  initialGeo?: CommunityFeedGeoFilter;
  displayFontClassName: string;
  isAuthenticated: boolean;
};

export function CommunityFeed({
  initialItems,
  initialCursor,
  initialFilter,
  initialGeo = {},
  displayFontClassName,
  isAuthenticated,
}: Props) {
  const [filter, setFilter] = useState(initialFilter);
  const [geo] = useState(initialGeo);
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  const loadFilter = useCallback((next: CommunityFeedFilter) => {
    setFilter(next);
    startTransition(async () => {
      const page = await getCommunityFeedPage(next, 20, null, geo);
      setItems(page.items);
      setCursor(page.nextCursor);
    });
  }, [geo]);

  const loadMore = () => {
    if (!cursor || isPending) return;
    startTransition(async () => {
      const page = await getCommunityFeedPage(filter, 20, cursor, geo);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    });
  };

  return (
    <div className="space-y-0">
      <div className="sticky top-[calc(var(--header-bar-height)+env(safe-area-inset-top))] z-40 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {SHARING_FEED_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => loadFilter(f.id)}
              disabled={isPending && filter !== f.id}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {isAuthenticated ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {filter === "following"
              ? "Posts from people you follow across channels, prayer, and praise."
              : "Posts from channels you walk with appear first."}
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-16 text-center sm:px-6">
          <p className={cn(displayFontClassName, "text-xl text-foreground")}>Nothing here yet</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {filter === "following"
              ? isAuthenticated
                ? "Follow people to see their posts here — browse channels and profiles to connect."
                : "Sign in and follow people to build your following feed."
              : filter === "prayer"
              ? "Prayer requests from the community will appear here."
              : filter === "questions"
                ? "Questions and seekers welcome — be the first to respond with grace."
                : filter === "testimonies"
                  ? "Testimonies and praise reports will show up as the community shares."
                  : filter === "devotionals"
                    ? "Daily devotionals with Scripture will appear here."
                    : "When channels publish and the community prays, stories will fill this feed."}
          </p>
          <Link
            href={filter === "prayer" ? "/prayer/new" : "/channel/browse"}
            className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
          >
            {filter === "prayer" ? "Share a prayer request" : "Browse channels"}
          </Link>
        </div>
      ) : (
        <div role="feed" aria-label="Community feed" aria-busy={isPending}>
          {items.map((item) => (
            <CommunityFeedCard
              key={`${item.postKind}:${item.id}`}
              item={item}
              displayFontClassName={displayFontClassName}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}

      {cursor ? (
        <div className="flex justify-center border-t border-border/60 px-4 py-8">
          <Button type="button" variant="outline" onClick={loadMore} disabled={isPending}>
            {isPending ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
