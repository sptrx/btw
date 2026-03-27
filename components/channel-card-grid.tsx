"use client";

import { InteractiveLinkCard } from "@/components/interactive-link-card";

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
    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
      {channels.map((ch) => (
        <InteractiveLinkCard key={ch.id} href={`/channel/${ch.slug}`}>
          <h3 className="text-lg font-semibold tracking-tight">{ch.title}</h3>
          {ch.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ch.description}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            by {ch.profiles?.display_name ?? "Anonymous"}
          </p>
        </InteractiveLinkCard>
      ))}
    </div>
  );
}
