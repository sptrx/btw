"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Channel = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  profiles: { display_name?: string } | null;
};

type Props = { channels: Channel[] };

export function MyChannelCardGrid({ channels }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
      {channels.map((ch) => (
        <div
          key={ch.id}
          className={cn("btw-surface btw-surface-lift flex flex-col p-4 sm:p-5")}
        >
          <h3 className="text-lg font-semibold tracking-tight">{ch.title}</h3>
          {ch.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ch.description}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            by {ch.profiles?.display_name ?? "You"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="default" size="sm" className="min-h-10 touch-manipulation">
              <Link href={`/channel/${ch.slug}`}>View</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="min-h-10 touch-manipulation">
              <Link href={`/channel/${ch.slug}/settings`}>Edit & delete</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
