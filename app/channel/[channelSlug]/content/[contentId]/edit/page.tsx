import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getChannelBySlug,
  getChannelPages,
  getContentById,
  isChannelAuthor,
} from "@/actions/channels";
import { getAllTopicTags, getPostTagIds } from "@/actions/tags";
import { getCurrentUser, hasAcceptedContentDisclaimer } from "@/actions";
import EditContentForm from "./edit-content-form";

type Props = { params: Promise<{ channelSlug: string; contentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { contentId } = await params;
  const content = await getContentById(contentId);
  if (!content) return { title: "Edit content" };
  return { title: `Edit · ${content.title}` };
}

export default async function EditContentPage({ params }: Props) {
  const { channelSlug, contentId } = await params;

  const [channel, content, user] = await Promise.all([
    getChannelBySlug(channelSlug),
    getContentById(contentId),
    getCurrentUser(),
  ]);

  if (!channel || !content) notFound();
  if (!user) redirect(`/auth/login?next=/channel/${channelSlug}/content/${contentId}/edit`);

  const author = await isChannelAuthor(channel.id);
  if (!author) redirect(`/channel/${channelSlug}/content/${contentId}`);

  if (content.topic_id !== channel.id) notFound();

  const [pages, allTags, initialTagIds, hasAlreadyAcceptedDisclaimer] = await Promise.all([
    getChannelPages(channel.id),
    getAllTopicTags(),
    getPostTagIds(content.id),
    hasAcceptedContentDisclaimer(user.id),
  ]);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">
        <Link
          href={`/channel/${channelSlug}/content/${contentId}`}
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          ← Back to content
        </Link>
      </p>
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl mb-6">Edit content</h1>
      <EditContentForm
        channelId={channel.id}
        channelSlug={channelSlug}
        content={{
          id: content.id,
          type: content.type,
          title: content.title,
          body: content.body,
          page_id: content.page_id,
          media_urls: content.media_urls,
          is_featured: content.is_featured ?? false,
        }}
        pages={pages}
        allTags={allTags}
        initialTagIds={initialTagIds}
        hasAlreadyAcceptedDisclaimer={hasAlreadyAcceptedDisclaimer}
      />
    </div>
  );
}
