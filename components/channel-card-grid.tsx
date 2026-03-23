"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Channel = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  profiles: { display_name?: string } | null;
};

type Props = { channels: Channel[] };

export function ChannelCardGrid({ channels }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 py-4">
      {channels.map((ch) => (
        <Link
          key={ch.id}
          href={`/channel/${ch.slug}`}
          className="group block touch-manipulation rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div
            className={cn(
              "rounded-2xl h-full min-h-[4.5rem] w-full p-4 sm:p-5 overflow-hidden",
              "border border-border/50 dark:border-border/30",
              "bg-card text-card-foreground",
              "transition-colors duration-200 hover:border-border hover:bg-muted/30 active:bg-muted/40"
            )}
          >
            <h3 className="font-semibold text-lg tracking-tight">{ch.title}</h3>
            {ch.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {ch.description}
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              by {ch.profiles?.display_name ?? "Anonymous"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
