import Image from "next/image";
import Link from "next/link";
import { Clock, Heart } from "lucide-react";
import type { LandingFeedItem } from "@/actions/landing";
import { RelativeDate } from "@/components/relative-date";
import { cn } from "@/lib/utils";

type Props = {
  item: LandingFeedItem;
  displayFontClassName: string;
};

export function TestimonyPreviewCard({ item, displayFontClassName }: Props) {
  return (
    <article className="btw-surface flex h-full flex-col p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-3">
        <Link
          href={`/channel/${item.channelSlug}`}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted"
        >
          {item.channelCoverUrl ? (
            <Image
              src={item.channelCoverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
              {item.channelTitle.slice(0, 1)}
            </span>
          )}
        </Link>
        <div className="min-w-0">
          <Link
            href={`/channel/${item.channelSlug}`}
            className="truncate text-sm font-medium hover:underline"
          >
            {item.channelTitle}
          </Link>
          <p className="text-xs text-muted-foreground">
            <RelativeDate date={item.createdAt} />
          </p>
        </div>
      </div>
      <h3 className={cn(displayFontClassName, "mt-4 text-lg leading-snug")}>
        <Link href={item.href} className="hover:underline">
          {item.title}
        </Link>
      </h3>
      {item.bodySnippet ? (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">
          {item.bodySnippet}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-3 text-muted-foreground">
          {item.readMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {item.readMinutes} min
            </span>
          ) : null}
          {(item.reactionCount || item.likeCount) > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3.5" aria-hidden />
              {item.reactionCount || item.likeCount}
            </span>
          ) : null}
        </span>
        <Link href={item.href} className="font-medium text-primary hover:underline">
          Read story
        </Link>
      </div>
    </article>
  );
}
