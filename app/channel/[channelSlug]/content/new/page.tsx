import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getChannelBySlug, getChannelPages, isChannelAuthor } from "@/actions/channels";
import { getAllTopicTags } from "@/actions/tags";
import { getCurrentUser, hasAcceptedContentDisclaimer } from "@/actions";
import AddContentForm from "./add-content-form";

type Props = {
  params: Promise<{ channelSlug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export const metadata: Metadata = {
  title: "Add Content",
  description: "Add content to your channel",
};

export default async function NewContentPage({ params, searchParams }: Props) {
  const { channelSlug } = await params;
  const { page: pageId } = await searchParams;

  const [channel, user] = await Promise.all([
    getChannelBySlug(channelSlug),
    getCurrentUser(),
  ]);

  if (!channel) notFound();
  if (!user) redirect("/auth/login");

  const author = await isChannelAuthor(channel.id);
  if (!author) redirect(`/channel/${channelSlug}`);

  const [pages, allTags, hasAlreadyAcceptedDisclaimer] = await Promise.all([
    getChannelPages(channel.id),
    getAllTopicTags(),
    hasAcceptedContentDisclaimer(user.id),
  ]);
  const defaultPage = pages.find((p) => p.slug === "home") ?? pages[0];
  const selectedPage = pageId ? pages.find((p) => p.id === pageId) : defaultPage;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add content to {channel.title}</h1>
      <AddContentForm
        channelId={channel.id}
        channelSlug={channelSlug}
        pages={pages}
        defaultPageId={selectedPage?.id ?? null}
        allTags={allTags}
        hasAlreadyAcceptedDisclaimer={hasAlreadyAcceptedDisclaimer}
      />
    </div>
  );
}
