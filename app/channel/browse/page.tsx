import { Metadata } from "next";
import { Suspense } from "react";
import { fetchChannels } from "@/actions/channels";
import { getAllTopicTags } from "@/actions/tags";
import { ChannelCardGrid } from "@/components/channel-card-grid";
import { BrowseBySharingType } from "@/components/browse-by-sharing-type";
import { RegionFilter } from "@/components/geo/region-filter";
import { BrowseTopicFilter } from "@/components/tags/browse-topic-filter";
import { Button } from "@/components/ui/button";
import { isGeoRegionId } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Browse channels",
  description: "Discover faith-based channels on BTW",
};

type Props = {
  searchParams: Promise<{ q?: string; topic?: string; region?: string }>;
};

export default async function BrowseChannelsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const topic = typeof sp.topic === "string" ? sp.topic.trim() : "";
  const regionParam = typeof sp.region === "string" ? sp.region.trim() : "";

  const [channels, allTags] = await Promise.all([
    fetchChannels({
      search: q || undefined,
      topicSlug: topic || undefined,
      regionId: isGeoRegionId(regionParam) ? regionParam : null,
    }),
    getAllTopicTags(),
  ]);

  const activeTagLabel = topic
    ? allTags.find((t) => t.slug === topic)?.label ?? topic
    : null;

  return (
    <div>
      <div className="mb-6">
        <p className="btw-section-eyebrow">Discover</p>
        <h1 className="btw-page-title">Browse channels</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
          Search and explore every public channel. Sign up to comment and follow what you care about.
        </p>
      </div>

      <form
        action="/channel/browse"
        method="get"
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        role="search"
      >
        <label htmlFor="channel-search" className="sr-only">
          Search channels
        </label>
        <input
          id="channel-search"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by title or description…"
          className="min-h-11 w-full flex-1 rounded-xl border border-input bg-background px-4 py-2 text-base text-foreground placeholder:text-muted-foreground/70 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          autoComplete="off"
        />
        {topic ? <input type="hidden" name="topic" value={topic} /> : null}
        <Button type="submit" className="min-h-11 w-full shrink-0 sm:w-auto">
          Search
        </Button>
      </form>

      <BrowseBySharingType />

      <Suspense fallback={null}>
        <RegionFilter basePath="/channel/browse" preserveParams={["q", "topic"]} className="mb-6" />
      </Suspense>

      <BrowseTopicFilter tags={allTags} />

      {channels.length === 0 ? (
        <div className="btw-empty">
          {q.trim()
            ? "No channels match your search. Try different words."
            : activeTagLabel
              ? `No channels tagged "${activeTagLabel}" yet.`
              : "No channels yet — check back soon."}
        </div>
      ) : (
        <ChannelCardGrid channels={channels} />
      )}
    </div>
  );
}
