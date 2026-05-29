import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/actions";
import {
  getPrayerWallFeed,
  getPraiseReports,
  type PrayerWallFilter,
} from "@/actions/prayer";
import { PrayerFilterTabs } from "@/components/prayer/prayer-filter-tabs";
import { PrayerRequestCard } from "@/components/prayer/prayer-request-card";
import { PraiseReportsSection } from "@/components/prayer/praise-reports-section";
import { Button } from "@/components/ui/button";
import { btwDisplayFont, btwLead, btwPageTitle } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

function parseFilter(raw: string | undefined): PrayerWallFilter {
  if (raw === "unanswered" || raw === "answered" || raw === "mine") return raw;
  return "all";
}

export default async function PrayerWallPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const [user, requests, praiseReports] = await Promise.all([
    getCurrentUser(),
    getPrayerWallFeed(filter),
    getPraiseReports(),
  ]);
  const isAuthenticated = !!user;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-12 md:py-14">
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
            No prayer requests here yet.
            {isAuthenticated ? (
              <>
                {" "}
                <Link href="/prayer/new" className="text-primary hover:underline">
                  Share the first one
                </Link>
                .
              </>
            ) : null}
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
