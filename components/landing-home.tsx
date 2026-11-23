import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingFeedItem } from "@/actions/landing";
import type { PrayerRequestListItem } from "@/actions/prayer";
import { LandingPublicFeed } from "@/components/landing-public-feed";
import { LandingFeatured } from "@/components/landing-featured";
import { LandingPrayerWidget } from "@/components/prayer/landing-prayer-widget";
import { LandingCta } from "@/components/landing-cta";
import { LandingSeekerSection } from "@/components/landing-seeker-section";

type LandingHomeProps = {
  displayFontClassName: string;
  /** Recent posts for the public feed */
  feed?: LandingFeedItem[];
  /** Hand-picked posts (editorial); section is hidden when empty */
  featured?: LandingFeedItem[];
  isAuthenticated?: boolean;
  prayerRequests?: PrayerRequestListItem[];
};

export function LandingHome({
  displayFontClassName,
  feed = [],
  featured = [],
  isAuthenticated = false,
  prayerRequests = [],
}: LandingHomeProps) {
  return (
    <article className="space-y-8">
      <section aria-labelledby="landing-feed-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h1 id="landing-feed-heading" className="text-lg font-semibold text-foreground">
              Home
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Latest posts from channels across the community.
            </p>
          </div>
          <Link
            href="/feed"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Community feed
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <LandingPublicFeed displayFontClassName={displayFontClassName} feed={feed} />
        </div>
      </section>

      <LandingFeatured items={featured} displayFontClassName={displayFontClassName} />

      {prayerRequests.length > 0 ? (
        <LandingPrayerWidget
          requests={prayerRequests}
          displayFontClassName={displayFontClassName}
        />
      ) : null}

      <LandingSeekerSection displayFontClassName={displayFontClassName} />
      <LandingCta displayFontClassName={displayFontClassName} isAuthenticated={isAuthenticated} />
    </article>
  );
}
