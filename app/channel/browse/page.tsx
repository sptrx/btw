import { Metadata } from "next";
import { fetchChannels } from "@/actions/channels";
import { ChannelCardGrid } from "@/components/channel-card-grid";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Browse channels",
  description: "Discover faith-based channels on BTW",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function BrowseChannelsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const channels = await fetchChannels({ search: q || undefined });

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
        className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center"
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
        <Button type="submit" className="min-h-11 w-full shrink-0 sm:w-auto">
          Search
        </Button>
      </form>

      {channels.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {q.trim()
            ? "No channels match your search. Try different words."
            : "No channels yet."}
        </p>
      ) : (
        <ChannelCardGrid channels={channels} />
      )}
    </div>
  );
}
