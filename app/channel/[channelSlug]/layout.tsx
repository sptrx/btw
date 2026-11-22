import { notFound } from "next/navigation";
import { getChannelBySlug, getChannelSidebarPages, isChannelAuthor } from "@/actions/channels";
import { getCurrentUser } from "@/actions";
import { isFollowingUser } from "@/actions/follows";
import { isWalkingWithChannel } from "@/actions/library";
import ChannelSidebar from "./channel-sidebar";
import { ChannelArchiveSection } from "./settings/channel-archive-section";

type Props = {
  children: React.ReactNode;
  params: Promise<{ channelSlug: string }>;
};

export default async function ChannelSlugLayout({ children, params }: Props) {
  const { channelSlug } = await params;
  const channel = await getChannelBySlug(channelSlug);
  if (!channel) notFound();

  const [pages, isAuthor, user] = await Promise.all([
    getChannelSidebarPages(channel.id),
    isChannelAuthor(channel.id),
    getCurrentUser(),
  ]);

  const [walkingWith, viewerFollowsAuthor] = await Promise.all([
    user && !isAuthor ? isWalkingWithChannel(channel.id, user.id) : Promise.resolve(false),
    user && !isAuthor
      ? isFollowingUser(user.id, channel.author_id)
      : Promise.resolve(false),
  ]);

  const homePage = pages.find((p) => p.slug === "home");

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <ChannelSidebar
        channel={{
          id: channel.id,
          title: channel.title,
          description: channel.description,
          author_id: channel.author_id,
          profiles: channel.profiles
            ? {
                display_name: channel.profiles.display_name,
                username: (channel.profiles as { username?: string }).username,
                country_code: (channel.profiles as { country_code?: string }).country_code,
              }
            : null,
        }}
        channelSlug={channelSlug}
        pages={pages}
        isAuthor={isAuthor}
        homePageId={homePage?.id ?? null}
        showWalkWith={!isAuthor}
        walkingWith={walkingWith}
        isAuthenticated={!!user}
        viewerFollowsAuthor={viewerFollowsAuthor}
      />
      <div className="min-w-0 flex-1">
        {channel.archived_at && (
          <div
            role="status"
            className="mb-4 space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
          >
            <p className="font-medium text-foreground">
              {isAuthor ? "This channel is archived." : "This archived channel is hidden from the public."}
            </p>
            {isAuthor && (
              <>
                <p className="text-muted-foreground">Only you (and site moderators) can see it.</p>
                <ChannelArchiveSection channelId={channel.id} archived />
              </>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
