"use client";

import Link from "next/link";
import type { RecentGeoPost } from "@/actions/map";
import { RelativeDate } from "@/components/relative-date";

type Props = {
  posts: RecentGeoPost[];
};

/** Scrolling ticker of recent posts with country flags. */
export function GeoPostTicker({ posts }: Props) {
  if (posts.length === 0) return null;

  const items = [...posts, ...posts];

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 py-2">
      <div className="flex animate-[geo-ticker_40s_linear_infinite] gap-8 whitespace-nowrap px-4">
        {items.map((p, i) => (
          <Link
            key={`${p.href}-${i}`}
            href={p.href}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            <span aria-hidden>{p.flag}</span>
            <span className="font-medium text-foreground/90">{p.countryName}</span>
            <span className="text-muted-foreground/80" aria-hidden>
              ·
            </span>
            <span className="text-xs text-muted-foreground/90">
              {p.kind === "prayer" ? "Prayer" : "Post"}
            </span>
            <span className="text-muted-foreground/80" aria-hidden>
              ·
            </span>
            <span className="max-w-[12rem] truncate">{p.title}</span>
            <span className="text-muted-foreground/80" aria-hidden>
              ·
            </span>
            <RelativeDate date={p.createdAt} className="tabular-nums text-xs" />
          </Link>
        ))}
      </div>
    </div>
  );
}
