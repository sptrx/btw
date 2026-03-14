import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getChannelBySlug, isChannelAuthor } from "@/actions/channels";
import { getCurrentUser } from "@/actions";
import CreatePageForm from "./create-page-form";

type Props = { params: Promise<{ channelSlug: string }> };

export const metadata: Metadata = {
  title: "Add Page",
  description: "Add a sub-page to your channel",
};

export default async function NewPagePage({ params }: Props) {
  const { channelSlug } = await params;
  const [channel, user] = await Promise.all([
    getChannelBySlug(channelSlug),
    getCurrentUser(),
  ]);

  if (!channel) notFound();
  if (!user) redirect("/auth/login");

  const author = await isChannelAuthor(channel.id);
  if (!author) redirect(`/channel/${channelSlug}`);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add page to {channel.title}</h1>
      <CreatePageForm channelId={channel.id} channelSlug={channelSlug} />
    </div>
  );
}
