import { notFound } from "next/navigation";
import { getChannelBySlug, getChannelSidebarPages, isChannelAuthor } from "@/actions/channels";
import ChannelSidebar from "./channel-sidebar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ channelSlug: string }>;
};

export default async function ChannelSlugLayout({ children, params }: Props) {
  const { channelSlug } = await params;
  const channel = await getChannelBySlug(channelSlug);
  if (!channel) notFound();

  const [pages, isAuthor] = await Promise.all([
    getChannelSidebarPages(channel.id),
    isChannelAuthor(channel.id),
  ]);

  const homePage = pages.find((p) => p.slug === "home");

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <ChannelSidebar
        channel={{
          id: channel.id,
          title: channel.title,
          description: channel.description,
          profiles: channel.profiles,
        }}
        channelSlug={channelSlug}
        pages={pages}
        isAuthor={isAuthor}
        homePageId={homePage?.id ?? null}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
