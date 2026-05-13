"use client";

import Image from "next/image";
import { FileText, Users } from "lucide-react";
import { InteractiveLinkCard } from "@/components/interactive-link-card";
import { TopicTagPill } from "@/components/tags/topic-tag-pill";
import { getChannelGradient } from "@/lib/channel-gradient";
import { cn } from "@/lib/utils";

type Channel = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  banner_image_url?: string | null;
  follower_count?: number;
  post_count?: number;
  tags?: { id: string; slug: string; label: string }[];
  profiles: { display_name?: string } | null;
};

type Props = { channels: Channel[] };

/** Hosts we have Next image optimisation configured for; everything else loads unoptimised. */
function shouldOptimizeImage(src: string): boolean {
  return src.startsWith("https://images.unsplash.com/");
}

export function ChannelCardGrid({ channels }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
      {channels.map((ch) => {
        const initial = (ch.title?.trim()?.[0] ?? "•").toUpperCase();
        const gradient = getChannelGradient(ch.slug || ch.title || ch.id);
        const followerCount = ch.follower_count ?? 0;
        const postCount = ch.post_count ?? 0;
        const hasMeta = followerCount > 0 || postCount > 0;

        return (
          <InteractiveLinkCard key={ch.id} href={`/channel/${ch.slug}`}>
            <div className="-mx-4 -mt-4 mb-4 sm:-mx-5 sm:-mt-5">
              {ch.banner_image_url ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  <Image
                    src={ch.banner_image_url}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    unoptimized={!shouldOptimizeImage(ch.banner_image_url)}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    "flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br",
                    gradient
                  )}
                  aria-hidden="true"
                >
                  <span className="text-5xl font-semibold tracking-tight text-white/90 drop-shadow-sm sm:text-6xl">
                    {initial}
                  </span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold tracking-tight">{ch.title}</h3>

            {hasMeta && (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {followerCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {followerCount} {followerCount === 1 ? "follower" : "followers"}
                  </span>
                )}
                {postCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    {postCount} {postCount === 1 ? "post" : "posts"}
                  </span>
                )}
              </div>
            )}

            {ch.tags && ch.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ch.tags.map((tag) => (
                  <TopicTagPill key={tag.id} tag={tag} asLink />
                ))}
              </div>
            )}

            {ch.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ch.description}</p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              by {ch.profiles?.display_name ?? "Anonymous"}
            </p>
          </InteractiveLinkCard>
        );
      })}
    </div>
  );
}
