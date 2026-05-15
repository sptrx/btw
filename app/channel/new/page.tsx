import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions";
import { getProfile } from "@/actions";
import { getAllTopicTags } from "@/actions/tags";
import CreateChannelForm from "./create-channel-form";

export const metadata: Metadata = {
  title: "Create Channel",
  description: "Create a new channel",
};

export default async function NewChannelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfile(user.id);
  if (profile?.role !== "channel_author") {
    redirect("/channel");
  }

  const allTags = await getAllTopicTags();

  return (
    <div>
      <p className="btw-section-eyebrow">Channels</p>
      <h1 className="btw-page-title">Create a channel</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        Add sub-pages for videos, podcasts, articles, and discussions. Manage all content from your channel.
      </p>
      <CreateChannelForm allTags={allTags} />
    </div>
  );
}
