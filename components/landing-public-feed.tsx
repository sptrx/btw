"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Heart,
  MessageCircle,
  Mic,
  MessagesSquare,
  Sparkles,
  Video,
} from "lucide-react";
import type { LandingChannelPill, LandingFeedItem } from "@/actions/landing";
import { ChannelContentMedia } from "@/components/channel-content-media";
import { RelativeDate } from "@/components/relative-date";
import { TopicTagPill } from "@/components/tags/topic-tag-pill";
import { cn } from "@/lib/utils";

type FeedFilter = "all" | "video" | "article" | "discussion";

const FILTER_OPTIONS: { value: FeedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Videos" },
  { value: "article", label: "Articles" },
  { value: "discussion", label: "Discussions" },
];

function parseFilterParam(raw: string | null): FeedFilter {
  if (raw === "video" || raw === "article" || raw === "discussion") return raw;
  return "all";
}

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

type FeedCardVariant = "default" | "featured";

function FeedCard({
  item,
  displayFontClassName,
  variant = "default",
}: {
  item: LandingFeedItem;
  displayFontClassName: string;
  variant?: FeedCardVariant;
}) {
  const previewMedia = item.mediaItems.slice(0, 1);
  const showEmbed = previewMedia.length > 0;

  const pageHref =
    item.pageSlug && item.pageSlug !== "home"
      ? `/channel/${item.channelSlug}/${item.pageSlug}`
      : null;

  const isFeatured = variant === "featured";

  return (
    <article
      className={cn(
        "relative transition-colors",
        isFeatured
          ? "snap-start shrink-0 min-w-[320px] sm:min-w-[360px] max-w-[360px] rounded-2xl border border-border/70 bg-background px-4 py-4 sm:px-5 hover:bg-muted/20"
          : "border-b border-border/80 px-4 py-4 sm:px-5 hover:bg-muted/20"
      )}
    >
      {isFeatured ? (
        <span
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary"
          aria-label="Featured post"
        >
          <Sparkles className="size-3" aria-hidden />
          Featured
        </span>
      ) : null}
      <div className="flex gap-3">
        <Link
          href={`/channel/${item.channelSlug}`}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted"
          aria-label={`${item.channelTitle} channel`}
        >
          {item.channelCoverUrl ? (
            <Image
              src={item.channelCoverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
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
              className="font-semibold text-foreground hover:underline truncate max-w-[12rem] sm:max-w-[16rem]"
            >
              {item.channelTitle}
            </Link>
            {pageHref && item.pageTitle ? (
              <>
                <span className="text-muted-foreground/80" aria-hidden>
                  ·
                </span>
                <Link href={pageHref} className="truncate hover:underline max-w-[10rem] sm:max-w-[14rem]">
                  {item.pageTitle}
                </Link>
              </>
            ) : null}
            <span className="text-muted-foreground/80" aria-hidden>
              ·
            </span>
            <RelativeDate date={item.createdAt} className="tabular-nums shrink-0" />
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <TypeIcon type={item.type} />
              {item.type}
            </span>
          </div>

          <Link href={item.href} className="mt-1 block group">
            <h3
              className={cn(
                displayFontClassName,
                "text-[17px] sm:text-lg font-normal leading-snug text-foreground group-hover:text-primary transition-colors"
              )}
            >
              {item.title}
            </h3>
          </Link>

          {item.bodySnippet ? (
            <Link href={item.href} className="mt-1.5 block">
              <p className="text-[15px] text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap">
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
  featured?: LandingFeedItem[];
  recentChannels: LandingChannelPill[];
};

export function LandingPublicFeed({
  displayFontClassName,
  feed,
  featured = [],
  recentChannels,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = parseFilterParam(searchParams.get("type"));

  const filteredFeed = useMemo(() => {
    if (activeFilter === "all") return feed;
    return feed.filter((item) => item.type === activeFilter);
  }, [feed, activeFilter]);

  const setFilter = useCallback(
    (next: FeedFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") {
        params.delete("type");
      } else {
        params.set("type", next);
      }
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  const activeLabel =
    FILTER_OPTIONS.find((opt) => opt.value === activeFilter)?.label.toLowerCase() ?? "posts";

  const featuredCapped = featured.slice(0, 4);

  return (
    <div className="w-full">
      {featuredCapped.length > 0 ? (
        <section
          aria-labelledby="landing-featured-heading"
          className="border-b border-border/80 bg-muted/15 px-4 py-4 sm:px-5"
        >
          <h2
            id="landing-featured-heading"
            className={cn(
              displayFontClassName,
              "inline-flex items-center gap-1.5 text-lg sm:text-xl font-normal text-foreground"
            )}
          >
            <Sparkles className="size-4 text-muted-foreground" aria-hidden />
            Featured
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Highlights picked from across the community
          </p>
          <div className="mt-3 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:thin] -mx-4 sm:-mx-5 px-4 sm:px-5">
            {featuredCapped.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                displayFontClassName={displayFontClassName}
                variant="featured"
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="border-b border-border/80 bg-background/95 px-4 py-3 sm:px-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <h2 className={cn(displayFontClassName, "text-lg sm:text-xl font-normal text-foreground")}>
          Latest
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Posts, clips, and pages from across the community</p>
      </div>

      {recentChannels.length > 0 ? (
        <div className="border-b border-border/60 bg-muted/15 px-3 py-3 sm:px-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Channels
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-pl-1 [scrollbar-width:thin]">
            {recentChannels.map((ch) => (
              <Link
                key={ch.slug}
                href={`/channel/${ch.slug}`}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-background pl-1 pr-3 py-1 hover:bg-muted/60 transition-colors"
              >
                <span className="relative h-8 w-8 overflow-hidden rounded-full border border-border/50 bg-muted">
                  {ch.coverImageUrl ? (
                    <Image
                      src={ch.coverImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="32px"
                      unoptimized={cardImageUnoptimized(ch.coverImageUrl)}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                      {ch.title.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="max-w-[7rem] truncate text-sm font-medium">{ch.title}</span>
              </Link>
            ))}
            <Link
              href="/channel/browse"
              className="flex shrink-0 items-center self-center rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-primary hover:bg-muted/50"
            >
              More
            </Link>
          </div>
        </div>
      ) : null}

      <div className="border-b border-border/60 bg-background px-3 py-2.5 sm:px-4">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
          <div
            role="tablist"
            aria-label="Filter feed by content type"
            className="flex gap-2 whitespace-nowrap"
          >
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {feed.length === 0 ? (
        <div className="px-4 py-16 text-center sm:px-6">
          <p className={cn(displayFontClassName, "text-xl text-foreground")}>Nothing here yet</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            When channels publish video, articles, and discussion, they will show up in this feed.
          </p>
          <Link
            href="/channel/browse"
            className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Browse channels
          </Link>
        </div>
      ) : filteredFeed.length === 0 ? (
        <div className="px-4 py-16 text-center sm:px-6">
          <p className={cn(displayFontClassName, "text-xl text-foreground")}>
            No {activeLabel} yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Check back soon — or browse all posts to see what the community is sharing.
          </p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Show all posts
          </button>
        </div>
      ) : (
        <div role="feed" aria-label="Latest posts from channels">
          {filteredFeed.map((item) => (
            <FeedCard key={item.id} item={item} displayFontClassName={displayFontClassName} />
          ))}
        </div>
      )}
    </div>
  );
}
