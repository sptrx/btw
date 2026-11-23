"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  getCommunityFeedPage,
  type CommunityFeedCursor,
  type CommunityFeedFilter,
  type CommunityFeedItem,
} from "@/actions/feed";
import { CommunityFeedCard } from "@/components/feed/community-feed-card";
import { WordOfGodPanel } from "@/components/word-of-god-panel";
import type { WordOfGodToday } from "@/actions/word-of-god";
import { cn } from "@/lib/utils";

type HomeTab = "for_you" | "following" | "word";

const TABS: { id: HomeTab; label: string }[] = [
  { id: "for_you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "word", label: "Word Of God" },
];

type Props = {
  isAuthenticated: boolean;
  initialTab: HomeTab;
  initialFilter: CommunityFeedFilter;
  initialItems: CommunityFeedItem[];
  initialCursor: CommunityFeedCursor | null;
  word: WordOfGodToday | null;
  displayFontClassName: string;
};

export function HomeFeed({
  isAuthenticated,
  initialTab,
  initialFilter,
  initialItems,
  initialCursor,
  word,
  displayFontClassName,
}: Props) {
  const [tab, setTab] = useState<HomeTab>(initialTab);
  const [filter, setFilter] = useState(initialFilter);
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback((next: CommunityFeedFilter, after: CommunityFeedCursor | null) => {
    pendingRef.current = true;
    setLoading(true);
    startTransition(async () => {
      const page = await getCommunityFeedPage(next, 20, after);
      setItems((prev) => (after ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
      setFilter(next);
      pendingRef.current = false;
      setLoading(false);
    });
  }, []);

  const selectTab = (next: HomeTab) => {
    setTab(next);
    if (next === "word") return;
    const nextFilter: CommunityFeedFilter = next === "following" ? "following" : "for_you";
    setItems([]);
    setCursor(null);
    load(nextFilter, null);
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || tab === "word" || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || pendingRef.current || !cursor) return;
        load(filter, cursor);
      },
      { rootMargin: "480px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, filter, load, tab]);

  return (
    <section aria-labelledby="home-feed-heading">
      <h1 id="home-feed-heading" className="sr-only">
        Home
      </h1>
      {isAuthenticated ? (
        <div
          className="sticky top-[calc(var(--header-bar-height)+env(safe-area-inset-top))] z-40 border-b border-border/80 bg-background/95 backdrop-blur-sm"
          role="tablist"
          aria-label="Home"
        >
          <div className="grid grid-cols-3">
            {TABS.map((item) => {
              const selected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectTab(item.id)}
                  className={cn(
                    "border-b-2 px-2 py-3 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "word" && word ? (
        <WordOfGodPanel initial={word} />
      ) : items.length === 0 && !isPending && !loading ? (
        <div className="px-4 py-16 text-center sm:px-6">
          <p className={cn(displayFontClassName, "text-xl text-foreground")}>Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {filter === "following"
              ? "Follow people to see their posts here. Browse channels and profiles to connect."
              : "When channels publish, stories, videos, and articles will fill this feed."}
          </p>
          <Link href="/channel/browse" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">
            Browse channels
          </Link>
        </div>
      ) : (
        <div role="feed" aria-label="Home" aria-busy={isPending} className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          {items.map((item) => (
            <CommunityFeedCard
              key={`${item.postKind}:${item.id}`}
              item={item}
              displayFontClassName={displayFontClassName}
              isAuthenticated={isAuthenticated}
            />
          ))}
          <div ref={sentinelRef} className="h-8" />
          {isPending ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
