import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Heart,
  MessageCircle,
  Mic,
  MessagesSquare,
  Video,
} from "lucide-react";
import type { LandingFeedItem } from "@/actions/landing";
import { ChannelContentMedia } from "@/components/channel-content-media";
import { RelativeDate } from "@/components/relative-date";
import { TopicTagPill } from "@/components/tags/topic-tag-pill";
import { cn } from "@/lib/utils";

function cardImageUnoptimized(src: string) {
  return !src.includes("images.unsplash.com");
}

function TypeIcon({ type }: { type: LandingFeedItem["type"] }) {
  const cls = "h-3.5 w-3.5 shrink-0 text-muted-foreground";
  switch (type) {
    case "video":
      return <Video className={cls} aria-hidden />;
    case "podcast":
      return <Mic className={cls} aria-hidden />;
    case "discussion":
      return <MessagesSquare className={cls} aria-hidden />;
    default:
      return <FileText className={cls} aria-hidden />;
  }
}

function FeedCard({
  item,
  displayFontClassName,
}: {
  item: LandingFeedItem;
  displayFontClassName: string;
}) {
  const previewMedia = item.mediaItems.slice(0, 1);
  const showEmbed = previewMedia.length > 0;

  const pageHref =
    item.pageSlug && item.pageSlug !== "home"
      ? `/channel/${item.channelSlug}/${item.pageSlug}`
      : null;

  return (
    <article className="border-b border-border/80 px-4 py-4 sm:px-6 transition-colors hover:bg-muted/20">
      <div className="flex gap-3 sm:gap-4">
        <Link
          href={`/channel/${item.channelSlug}`}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted sm:h-11 sm:w-11"
          aria-label={`${item.channelTitle} channel`}
        >
          {item.channelCoverUrl ? (
            <Image
              src={item.channelCoverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
              unoptimized={cardImageUnoptimized(item.channelCoverUrl)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
              {item.channelTitle.slice(0, 1).toUpperCase()}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-muted-foreground">
            <Link
              href={`/channel/${item.channelSlug}`}
              className="font-semibold text-foreground hover:underline truncate max-w-[14rem] sm:max-w-[20rem]"
            >
              {item.channelTitle}
            </Link>
            {pageHref && item.pageTitle ? (
              <>
                <span className="text-muted-foreground/80" aria-hidden>
                  ·
                </span>
                <Link href={pageHref} className="truncate hover:underline max-w-[12rem] sm:max-w-[18rem]">
                  {item.pageTitle}
                </Link>
              </>
            ) : null}
            <span className="text-muted-foreground/80" aria-hidden>
              ·
            </span>
            <RelativeDate date={item.createdAt} className="tabular-nums shrink-0" />
            <span className="btw-overline inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-1.5 py-0.5">
              <TypeIcon type={item.type} />
              {item.type}
            </span>
          </div>

          <Link href={item.href} className="mt-1 block group">
            <h3
              className={cn(
                displayFontClassName,
                "text-[17px] sm:text-xl font-normal leading-snug text-foreground group-hover:text-primary transition-colors"
              )}
            >
              {item.title}
            </h3>
          </Link>

          {item.bodySnippet ? (
            <Link href={item.href} className="mt-1.5 block">
              <p className="btw-prose text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                {item.bodySnippet}
              </p>
            </Link>
          ) : null}

          {showEmbed ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-muted/30">
              <ChannelContentMedia items={previewMedia} className="mt-0 space-y-0 p-2 sm:p-3" />
            </div>
          ) : null}

          {!showEmbed && item.type === "video" && previewMedia.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link href={item.href} className="font-medium text-primary hover:underline">
                Open post
              </Link>{" "}
              to add a watch link or video.
            </p>
          ) : null}

          <div className="mt-3 flex items-center gap-3 text-sm">
            <Link href={item.href} className="text-primary font-medium hover:underline">
              View post
            </Link>
            <Link href={`/channel/${item.channelSlug}`} className="text-muted-foreground hover:text-foreground">
              Channel
            </Link>
            {item.commentCount > 0 || item.likeCount > 0 ? (
              <div className="ml-auto inline-flex items-center gap-4 text-xs text-muted-foreground">
                {item.commentCount > 0 ? (
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`${item.commentCount} ${item.commentCount === 1 ? "comment" : "comments"}`}
                  >
                    <MessageCircle className="size-3.5" aria-hidden />
                    <span className="tabular-nums">{item.commentCount}</span>
                  </span>
                ) : null}
                {item.likeCount > 0 ? (
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`${item.likeCount} ${item.likeCount === 1 ? "like" : "likes"}`}
                  >
                    <Heart className="size-3.5" aria-hidden />
                    <span className="tabular-nums">{item.likeCount}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {item.tags && item.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <TopicTagPill key={tag.id} tag={tag} asLink />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

type Props = {
  displayFontClassName: string;
  feed: LandingFeedItem[];
};

export function LandingPublicFeed({ displayFontClassName, feed }: Props) {
  if (feed.length === 0) {
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <p className={cn(displayFontClassName, "text-xl text-foreground")}>Nothing here yet</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          When channels publish video, articles, and discussion, they will show up in this feed.
        </p>
        <Link
          href="/channel/browse"
          className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Browse channels
        </Link>
      </div>
    );
  }

  return (
    <div role="feed" aria-label="Latest posts from channels">
      {feed.map((item) => (
        <FeedCard key={item.id} item={item} displayFontClassName={displayFontClassName} />
      ))}
    </div>
  );
}
