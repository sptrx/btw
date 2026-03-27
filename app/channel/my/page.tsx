import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchMyChannels } from "@/actions/channels";
import { getCurrentUser, getProfile } from "@/actions";
import { MyChannelCardGrid } from "@/components/my-channel-card-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My channels",
  description: "Channels you manage",
};

type PageProps = { searchParams: Promise<{ deleted?: string }> };

export default async function MyChannelsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login?next=/channel/my");
  }

  const profile = await getProfile(user.id);
  if (profile?.role !== "channel_author") {
    return (
      <div className="space-y-4">
        <p className="btw-section-eyebrow">Channels</p>
        <h1 className="btw-page-title text-xl sm:text-2xl">My channels</h1>
        <p className="text-pretty text-sm text-muted-foreground sm:text-base">
          Only channel authors can manage channels. Your account is set up as a regular user.
        </p>
        <Button asChild variant="outline" className="min-h-11 touch-manipulation">
          <Link href="/channel">Browse channels</Link>
        </Button>
      </div>
    );
  }

  const channels = await fetchMyChannels();

  return (
    <div>
      {sp.deleted === "1" && (
        <p className="mb-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground" role="status">
          Channel removed.
        </p>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="btw-section-eyebrow">Channels</p>
          <h1 className="btw-page-title text-xl sm:text-2xl">My channels</h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            Create pages and content for channels you own.
          </p>
        </div>
        <Button asChild size="default" className="shrink-0 min-h-11 w-full touch-manipulation sm:w-auto">
          <Link href="/channel/new">Create channel</Link>
        </Button>
      </div>

      {channels.length === 0 ? (
        <div className={cn("btw-surface p-8 text-center")}>
          <p className="text-muted-foreground mb-4">You don&apos;t have any channels yet.</p>
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
