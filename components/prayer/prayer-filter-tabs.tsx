"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PrayerWallFilter } from "@/actions/prayer";
import { cn } from "@/lib/utils";

const TABS: { id: PrayerWallFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unanswered", label: "Unanswered" },
  { id: "answered", label: "Answered" },
  { id: "mine", label: "My Requests" },
];

export function PrayerFilterTabs({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("filter") as PrayerWallFilter) || "all";

  return (
    <div
      className="flex flex-wrap gap-1 border-b border-border/60 px-4 sm:px-6"
      role="tablist"
      aria-label="Filter prayer requests"
    >
      {TABS.map((tab) => {
        if (tab.id === "mine" && !isAuthenticated) return null;
        const active = current === tab.id || (current === "all" && tab.id === "all" && !searchParams.get("filter"));
        const href =
          tab.id === "all" ? pathname : `${pathname}?filter=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "relative px-3 py-3 text-sm font-medium transition-colors -mb-px border-b-2",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
