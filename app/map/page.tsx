import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMapSummary } from "@/actions/map";
import { FaithWorldMap } from "@/components/map/faith-world-map";
import { RegionFilter } from "@/components/geo/region-filter";
import { btwDisplayFont } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Faith Around the World",
  description:
    "See testimonies, prayer, and community from every corner of the earth on Believe The Works.",
};

export default async function MapPage() {
  const summary = await getMapSummary();

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <header className="border-b border-border/80 py-8 sm:py-10">
        <p className="btw-overline text-muted-foreground">Global community</p>
        <h1
          className={cn(
            btwDisplayFont,
            "mt-1 text-3xl font-normal text-foreground sm:text-4xl"
          )}
        >
          Faith around the world
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Christian faith is lived on every continent. Countries with community posts glow on the
          map — hover for details, click to read posts from that nation. Location is always
          country-level and optional.
        </p>
        {summary.countryCount > 0 ? (
          <p className="mt-3 text-sm text-foreground">
            <span className="font-semibold tabular-nums">{summary.countryCount}</span>{" "}
            {summary.countryCount === 1 ? "country" : "countries"} ·{" "}
            <span className="font-semibold tabular-nums">{summary.totalPosts}</span> tagged posts
          </p>
        ) : null}
        <p className="mt-4 text-sm">
          <Link href="/feed" className="font-medium text-primary hover:underline">
            Browse the faith feed
          </Link>
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <Suspense
          fallback={
            <div className="min-h-[320px] rounded-xl border border-border bg-muted/20 animate-pulse" />
          }
        >
          <FaithWorldMap />
        </Suspense>

        <RegionFilter basePath="/feed" preserveParams={["filter", "country"]} />
      </div>
    </div>
  );
}
