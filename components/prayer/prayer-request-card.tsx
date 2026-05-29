import Link from "next/link";
import type { PrayerRequestListItem } from "@/actions/prayer";
import { truncateBody } from "@/lib/prayer-display";
import { RelativeDate } from "@/components/relative-date";
import { PrayingButton } from "@/components/prayer/praying-button";
import { cn } from "@/lib/utils";
import { FollowUserButton } from "@/components/follow-user-button";
import { CountryBadge } from "@/components/geo/country-badge";
import { profilePath } from "@/lib/profile-url";

type Props = {
  item: PrayerRequestListItem;
  isAuthenticated: boolean;
  displayFontClassName?: string;
  authorUsername?: string | null;
  viewerFollowsAuthor?: boolean;
};

export function PrayerRequestCard({
  item,
  isAuthenticated,
  displayFontClassName,
  authorUsername,
  viewerFollowsAuthor = false,
}: Props) {
  const author =
    item.authorDisplayName?.trim() || (item.isAnonymous ? "A sister/brother in Christ" : "Community member");

  return (
    <article className="border-b border-border/80 px-4 py-5 sm:px-6 transition-colors hover:bg-muted/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
            {authorUsername && !item.isAnonymous ? (
              <Link
                href={profilePath({ id: item.authorId, username: authorUsername })}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {author}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{author}</span>
            )}
            {!item.isAnonymous &&
            isAuthenticated &&
            !viewerFollowsAuthor &&
            item.authorId ? (
              <>
                <span aria-hidden>·</span>
                <FollowUserButton
                  userId={item.authorId}
                  displayName={author}
                  initialFollowing={false}
                  isAuthenticated={isAuthenticated}
                  loginNext={`/prayer/${item.id}`}
                  variant="link"
                />
              </>
            ) : null}
            <span aria-hidden>·</span>
            <RelativeDate date={item.createdAt} className="tabular-nums shrink-0" />
            {item.status === "answered" ? (
              <span className="btw-overline rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                Answered
              </span>
            ) : null}
          </div>
          {item.countryCode ? (
            <CountryBadge countryCode={item.countryCode} />
          ) : null}
          <Link href={`/prayer/${item.id}`} className="group block space-y-1.5">
            <h2
              className={cn(
                displayFontClassName,
                "text-lg font-normal text-foreground group-hover:text-primary transition-colors sm:text-xl"
              )}
            >
              {item.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {truncateBody(item.body)}
            </p>
          </Link>
        </div>
        <div className="shrink-0 sm:pt-1">
          <PrayingButton
            prayerRequestId={item.id}
            initialCount={item.prayerCount}
            initialPraying={item.userIsPraying}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </article>
  );
}
