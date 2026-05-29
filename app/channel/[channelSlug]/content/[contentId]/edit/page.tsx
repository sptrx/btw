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
  const user = await getCurrentUser();
  const content = await getContentById(contentId, { viewerUserId: user?.id });
  if (!content) return { title: "Edit content" };
  return { title: `Edit · ${content.title}` };
}

export default async function EditContentPage({ params }: Props) {
  const { channelSlug, contentId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/channel/${channelSlug}/content/${contentId}/edit`);

  const [channel, content] = await Promise.all([
    getChannelBySlug(channelSlug),
    getContentById(contentId, { viewerUserId: user.id }),
  ]);

  if (!channel || !content) notFound();

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
      <h1 className="btw-page-title-sm mb-6">Edit content</h1>
      <EditContentForm
        channelId={channel.id}
        channelSlug={channelSlug}
        content={{
          id: content.id,
          type: content.type,
          sharing_type:
            (content as { sharing_type?: string }).sharing_type ?? "testimony",
          scripture_reference:
            (content as { scripture_reference?: string | null }).scripture_reference ?? null,
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
