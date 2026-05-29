import Link from "next/link";
import { Suspense } from "react";
import { getCommunityFeedPage, type CommunityFeedGeoFilter } from "@/actions/feed";
import { getCurrentUser } from "@/actions";
import { getPeopleYouMayKnow } from "@/actions/follows";
import { CommunityFeed } from "@/components/feed/community-feed";
import { RegionFilter } from "@/components/geo/region-filter";
import { PeopleYouMayKnow } from "@/components/people-you-may-know";
import { btwDisplayFont } from "@/lib/btw-ui";
import { isGeoRegionId, normalizeCountryCode } from "@/lib/geo";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ filter?: string; region?: string; country?: string }>;
};

const VALID_FILTERS = new Set([
  "all",
  "following",
  "testimonies",
  "revelations",
  "questions",
  "devotionals",
  "discussions",
  "praise",
  "prayer",
  "videos",
]);

export default async function FeedPage({ searchParams }: Props) {
  const params = await searchParams;
  const filterParam = params.filter ?? "all";
  const filter = VALID_FILTERS.has(filterParam)
    ? (filterParam as import("@/actions/feed").CommunityFeedFilter)
    : "all";

  const regionParam = params.region?.trim() ?? "";
  const countryParam = normalizeCountryCode(params.country);
  const geo: CommunityFeedGeoFilter = {
    regionId: isGeoRegionId(regionParam) ? regionParam : null,
    countryCode: countryParam,
  };

  const [user, page, suggestions] = await Promise.all([
    getCurrentUser(),
    getCommunityFeedPage(filter, 20, null, geo),
    getPeopleYouMayKnow(5),
  ]);

  return (
    <div className="container mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <div className="lg:grid lg:grid-cols-[1fr_17rem] lg:gap-8 lg:items-start">
        <div className="min-w-0 max-w-3xl lg:max-w-none">
      <header className="border-b border-border/80 px-4 py-8 sm:px-6">
        <p className="btw-overline text-muted-foreground">Community</p>
        <h1 className={cn(btwDisplayFont, "mt-1 text-3xl font-normal text-foreground sm:text-4xl")}>
          Faith feed
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
          Stories, teaching, prayer, and praise from across Believe The Works — newest first, with
          channels you walk with highlighted.
        </p>
        {!user ? (
          <p className="mt-4 text-sm">
            <Link href="/auth/login?next=/feed" className="font-medium text-primary hover:underline">
              Sign in
            </Link>{" "}
            to respond with faith reactions and see your channels first.
          </p>
        ) : null}
      </header>

      <div className="mb-4 px-4 sm:px-6">
        <Suspense fallback={null}>
          <RegionFilter basePath="/feed" preserveParams={["filter", "country"]} />
        </Suspense>
      </div>

      <div className="overflow-hidden rounded-none sm:rounded-b-xl border-x-0 sm:border-x border-border/80 bg-muted/35 dark:bg-muted/15">
        <CommunityFeed
          initialItems={page.items}
          initialCursor={page.nextCursor}
          initialFilter={filter}
          initialGeo={geo}
          displayFontClassName={btwDisplayFont}
          isAuthenticated={!!user}
        />
      </div>
        </div>

        {user && suggestions.length > 0 ? (
          <div className="mt-8 lg:mt-0 lg:sticky lg:top-24">
            <PeopleYouMayKnow suggestions={suggestions} isAuthenticated />
          </div>
        ) : null}
      </div>
    </div>
  );
}
