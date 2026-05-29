import Image from "next/image";
import Link from "next/link";
import { HandHeart, MessageCircle } from "lucide-react";
import type { CommunityFeedItem } from "@/actions/feed";
import { ChannelContentMedia } from "@/components/channel-content-media";
import { PostReactions } from "@/components/post-reactions";
import { RelativeDate } from "@/components/relative-date";
import { SharingTypeBadge } from "@/components/sharing-type-badge";
import { TopicTagPill } from "@/components/tags/topic-tag-pill";
import { cn } from "@/lib/utils";
import { FollowUserButton } from "@/components/follow-user-button";
import { CountryBadge } from "@/components/geo/country-badge";
import { profilePath } from "@/lib/profile-url";

function cardImageUnoptimized(src: string) {
  return !src.includes("images.unsplash.com");
}

type Props = {
  item: CommunityFeedItem;
  displayFontClassName: string;
  isAuthenticated: boolean;
};

export function CommunityFeedCard({ item, displayFontClassName, isAuthenticated }: Props) {
  const previewMedia = item.mediaItems?.slice(0, 1) ?? [];
  const showEmbed = previewMedia.length > 0;
  const isChannel = item.postKind === "topic_content";
  const isQuestion = item.sharingType === "question";
  const commentHref = `${item.href}#comments`;

  const pageHref =
    item.pageSlug && item.pageSlug !== "home" && item.channelSlug
      ? `/channel/${item.channelSlug}/${item.pageSlug}`
      : null;

  const sharingForBadge =
    item.sharingType ??
    (item.postKind === "prayer_request"
      ? "prayer_request"
      : item.postKind === "praise_report"
        ? "praise_report"
        : "testimony");

  return (
    <article
      className={cn(
        "relative border-b border-border/80 px-4 py-4 sm:px-6 transition-colors hover:bg-muted/20",
        item.fromFollowed && "bg-primary/[0.03]"
      )}
    >
      <div className="absolute left-4 top-4 z-10 sm:left-6">
        <SharingTypeBadge sharingType={sharingForBadge} />
      </div>

      <div className="flex gap-3 sm:gap-4 pt-6">
        {isChannel && item.channelSlug ? (
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
                {(item.channelTitle ?? "?").slice(0, 1).toUpperCase()}
              </span>
            )}
          </Link>
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/50 sm:h-11 sm:w-11"
            aria-hidden
          >
            <HandHeart className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-muted-foreground">
            {isChannel && item.channelSlug ? (
              <>
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
                    <Link href={pageHref} className="truncate hover:underline max-w-[12rem]">
                      {item.pageTitle}
                    </Link>
                  </>
                ) : null}
                {item.authorId && item.authorLabel ? (
                  <>
                    <span className="text-muted-foreground/80" aria-hidden>
                      ·
                    </span>
                    {item.authorUsername ? (
                      <Link
                        href={profilePath({ id: item.authorId, username: item.authorUsername })}
                        className="truncate hover:underline max-w-[10rem]"
                      >
                        {item.authorLabel}
                      </Link>
                    ) : (
                      <span>{item.authorLabel}</span>
                    )}
                    {isAuthenticated && !item.viewerFollowsAuthor ? (
                      <>
                        <span className="text-muted-foreground/80" aria-hidden>
                          ·
                        </span>
                        <FollowUserButton
                          userId={item.authorId}
                          displayName={item.authorLabel}
                          initialFollowing={false}
                          isAuthenticated={isAuthenticated}
                          loginNext={item.href}
                          variant="link"
                        />
                      </>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : item.authorLabel ? (
              <>
                {item.authorId && item.authorUsername ? (
                  <Link
                    href={profilePath({ id: item.authorId, username: item.authorUsername })}
                    className="font-semibold text-foreground hover:underline truncate max-w-[14rem]"
                  >
                    {item.authorLabel}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">{item.authorLabel}</span>
                )}
                {item.authorId &&
                isAuthenticated &&
                !item.viewerFollowsAuthor &&
                item.authorLabel !== "A sister/brother in Christ" ? (
                  <>
                    <span className="text-muted-foreground/80" aria-hidden>
                      ·
                    </span>
                    <FollowUserButton
                      userId={item.authorId}
                      displayName={item.authorLabel}
                      initialFollowing={false}
                      isAuthenticated={isAuthenticated}
                      loginNext={item.href}
                      variant="link"
                    />
                  </>
                ) : null}
              </>
            ) : null}
            {item.fromFollowed ? (
              <span className="btw-overline rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-primary">
                Walking with
              </span>
            ) : null}
            <span className="text-muted-foreground/80" aria-hidden>
              ·
            </span>
            <RelativeDate date={item.createdAt} className="tabular-nums shrink-0" />
          </div>

          {item.countryCode ? (
            <CountryBadge countryCode={item.countryCode} className="mt-1" />
          ) : null}

          {item.scriptureReference ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {item.scriptureReference}
            </p>
          ) : null}

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

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {isQuestion ? (
              <Link
                href={commentHref}
                className="inline-flex min-h-9 items-center rounded-full border border-teal-500/40 bg-teal-500/15 px-3.5 py-1 text-sm font-semibold text-teal-900 hover:bg-teal-500/25 dark:text-teal-100"
              >
                Answer this
              </Link>
            ) : null}
            <Link href={item.href} className="text-primary font-medium hover:underline">
              {item.postKind === "prayer_request" ? "View request" : "Open"}
            </Link>
            {isChannel && item.channelSlug ? (
              <Link
                href={`/channel/${item.channelSlug}`}
                className="text-muted-foreground hover:text-foreground"
              >
                Channel
              </Link>
            ) : null}
            {(item.commentCount ?? 0) > 0 ? (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="size-3.5" aria-hidden />
                <span className="tabular-nums">{item.commentCount}</span>
              </span>
            ) : null}
          </div>

          {item.tags && item.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <TopicTagPill key={tag.id} tag={tag} asLink />
              ))}
            </div>
          ) : null}

          <PostReactions
            postId={item.id}
            postKind={item.postKind}
            initialCounts={item.reactions}
            initialUserReaction={item.userReaction}
            isAuthenticated={isAuthenticated}
            loginNext={item.href}
            className="mt-3"
          />
        </div>
      </div>
    </article>
  );
}
