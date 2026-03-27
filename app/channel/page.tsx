import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchMyChannels } from "@/actions/channels";
import { getCurrentUser, getProfile } from "@/actions";
import { MyChannelCardGrid } from "@/components/my-channel-card-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your channels",
  description: "Channels you manage on BTW",
};

type PageProps = { searchParams: Promise<{ deleted?: string }> };

/**
 * Signed-in hub: only channels you own (for authors). Guests are sent to /channel/browse.
 */
export default async function ChannelsHubPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/channel/browse");
  }

  const profile = await getProfile(user.id);

  if (profile?.role !== "channel_author") {
    return (
      <div className="space-y-6">
        <div>
          <p className="btw-section-eyebrow">Channels</p>
          <h1 className="btw-page-title">Your channels</h1>
          <p className="mt-2 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
            Channel management is available to channel authors. You can still explore every channel on the site.
          </p>
        </div>
        <Button asChild className="min-h-11 touch-manipulation">
          <Link href="/channel/browse">Browse all channels</Link>
        </Button>
      </div>
    );
  }

  const channels = await fetchMyChannels();

  return (
    <div>
      {sp.deleted === "1" && (
        <p
          className="mb-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          Channel removed.
        </p>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="btw-section-eyebrow">Manage</p>
          <h1 className="btw-page-title">Your channels</h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            Open a channel to edit pages and content. This list is only what you own—no other channels here.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
          <Button asChild variant="outline" size="default" className="min-h-11 w-full touch-manipulation sm:w-auto">
            <Link href="/channel/browse">Browse all channels</Link>
          </Button>
          <Button asChild size="default" className="min-h-11 w-full touch-manipulation sm:w-auto">
            <Link href="/channel/new">Create channel</Link>
          </Button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className={cn("btw-surface p-8 text-center")}>
          <p className="mb-4 text-muted-foreground">You don&apos;t have any channels yet.</p>
          <Button asChild className="min-h-11 touch-manipulation">
            <Link href="/channel/new">Create your first channel</Link>
          </Button>
        </div>
      ) : (
        <MyChannelCardGrid channels={channels} />
      )}
    </div>
  );
}
