import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getChannelBySlug, getChannelPages, isChannelAuthor } from "@/actions/channels";
import { getAllTopicTags, getChannelTagIds } from "@/actions/tags";
import { getCurrentUser } from "@/actions";
import { ChannelSettingsForm } from "./channel-settings-form";
import { ChannelDeleteForm } from "./channel-delete-form";
import AddContentLink from "../add-content-link";

type Props = { params: Promise<{ channelSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { channelSlug } = await params;
  const channel = await getChannelBySlug(channelSlug);
  if (!channel) return { title: "Channel" };
  return { title: `Settings · ${channel.title}` };
}

export default async function ChannelSettingsPage({ params }: Props) {
  const { channelSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/channel/${channelSlug}/settings`);

  const channel = await getChannelBySlug(channelSlug);
  if (!channel) notFound();

  const isAuthor = await isChannelAuthor(channel.id);
  if (!isAuthor) {
    redirect(`/channel/${channelSlug}`);
  }

  const [pages, allTags, initialTagIds] = await Promise.all([
    getChannelPages(channel.id),
    getAllTopicTags(),
    getChannelTagIds(channel.id),
  ]);
  const homePage = pages.find((p) => p.slug === "home");
  const defaultPageIdForContent = homePage?.id ?? pages[0]?.id ?? null;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href={`/channel/${channelSlug}`} className="hover:text-foreground underline-offset-4 hover:underline">
            ← Back to channel
          </Link>
        </p>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Channel settings</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Update how your channel appears, or remove it permanently.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <ChannelSettingsForm
          channelId={channel.id}
          initialTitle={channel.title}
          initialDescription={channel.description ?? ""}
          initialSlug={channel.slug}
          allTags={allTags}
          initialTagIds={initialTagIds}
        />
      </section>

      <section
        className="rounded-xl border-2 border-primary/25 bg-primary/5 p-6 shadow-sm"
        aria-labelledby="settings-add-content-heading"
      >
        <h2 id="settings-add-content-heading" className="text-lg font-semibold mb-2">
          Add content
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Create a new post with text, images, or video. You can choose which page it belongs to on the next step.
        </p>
        <AddContentLink pageId={defaultPageIdForContent} channelSlug={channelSlug} label="+ Add content to this page" />
      </section>

      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold text-destructive mb-1">Danger zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting removes the channel, all its pages, and all content. This cannot be undone.
        </p>
        <ChannelDeleteForm channelId={channel.id} channelTitle={channel.title} />
      </section>
    </div>
  );
}
