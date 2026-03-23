import { Metadata } from "next";
import Link from "next/link";
import { fetchChannels } from "@/actions/channels";
import { getCurrentUser } from "@/actions";
import { ChannelCardGrid } from "@/components/channel-card-grid";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Channels",
  description: "Browse faith-based channels",
};

export default async function ChannelsPage() {
  const [channels, user] = await Promise.all([fetchChannels(), getCurrentUser()]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Channels</h1>
          <p className="text-muted-foreground mt-1 text-pretty text-sm sm:text-base">
            Explore channels with videos, podcasts, articles, and discussions. Sign up to leave feedback and comments.
          </p>
        </div>
        {user && (
          <Button asChild size="default" className="shrink-0 min-h-11 w-full touch-manipulation sm:w-auto">
            <Link href="/channel/new">Create channel</Link>
          </Button>
        )}
      </div>

      <ChannelCardGrid channels={channels} />
    </div>
  );
}
