import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/actions";
import {
  getPrayerWallFeed,
  getPraiseReports,
  type PrayerWallFilter,
  type PrayerWallGeoFilter,
} from "@/actions/prayer";
import { RegionFilter } from "@/components/geo/region-filter";
import { isGeoRegionId, normalizeCountryCode } from "@/lib/geo";
import { PrayerFilterTabs } from "@/components/prayer/prayer-filter-tabs";
import { PrayerRequestCard } from "@/components/prayer/prayer-request-card";
import { PrayerHowItWorks } from "@/components/prayer/prayer-how-it-works";
import { PraiseReportsSection } from "@/components/prayer/praise-reports-section";
import { Button } from "@/components/ui/button";
import { btwDisplayFont, btwLead, btwPageTitle } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Prayer Wall",
  description: "Share needs, pray for one another, and celebrate when God answers.",
  path: "/prayer",
});

type Props = {
  searchParams: Promise<{ filter?: string; region?: string; country?: string }>;
};

function parseFilter(raw: string | undefined): PrayerWallFilter {
  if (raw === "unanswered" || raw === "answered" || raw === "mine") return raw;
  return "all";
}

export default async function PrayerWallPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const regionParam = params.region?.trim() ?? "";
  const geo: PrayerWallGeoFilter = {
    regionId: isGeoRegionId(regionParam) ? regionParam : null,
    countryCode: normalizeCountryCode(params.country),
  };
  const [user, requests, praiseReports] = await Promise.all([
    getCurrentUser(),
    getPrayerWallFeed(filter, 40, geo),
    getPraiseReports(),
  ]);
  const isAuthenticated = !!user;

  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="btw-overline text-primary">Community</p>
          <h1 className={cn(btwPageTitle, btwDisplayFont)}>Prayer Wall</h1>
          <p className={cn(btwLead, "max-w-lg text-muted-foreground")}>
            Share needs, pray for one another, and celebrate when God answers.
          </p>
        </div>
        {isAuthenticated ? (
          <Button asChild className="rounded-full shrink-0">
            <Link href="/prayer/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              New request
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="rounded-full shrink-0">
            <Link href="/auth/login?next=/prayer/new">Sign in to submit</Link>
          </Button>
        )}
      </header>

      <PrayerHowItWorks defaultOpen={!isAuthenticated} />

      <div className="mb-6">
        <Suspense fallback={null}>
          <RegionFilter basePath="/prayer" preserveParams={["filter", "country"]} />
        </Suspense>
      </div>

      <div className="rounded-xl border border-border/80 bg-background shadow-sm overflow-hidden">
        <Suspense fallback={null}>
          <PrayerFilterTabs isAuthenticated={isAuthenticated} />
        </Suspense>
        {filter === "mine" && !isAuthenticated ? (
          <p className="px-4 py-8 text-sm text-muted-foreground sm:px-6">
            <Link href="/auth/login?next=/prayer?filter=mine" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to see your prayer requests.
          </p>
        ) : requests.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground sm:px-6">
            No prayer requests here yet. Be the first to ask the community to pray with you.
            {isAuthenticated ? (
              <>
                {" "}
                <Link href="/prayer/new" className="text-primary hover:underline">
                  Share a prayer request
                </Link>
                .
              </>
            ) : (
              <>
                {" "}
                <Link href="/auth/signup" className="text-primary hover:underline">
                  Create a free account
                </Link>{" "}
                to share one.
              </>
            )}
          </p>
        ) : (
          <div>
            {requests.map((item) => (
              <PrayerRequestCard
                key={item.id}
                item={item}
                isAuthenticated={isAuthenticated}
                displayFontClassName={btwDisplayFont}
                authorUsername={item.authorUsername}
                viewerFollowsAuthor={item.viewerFollowsAuthor}
              />
            ))}
          </div>
        )}
      </div>

      <PraiseReportsSection reports={praiseReports} displayFontClassName={btwDisplayFont} />
    </div>
  );
}
