import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getChannelBySlug,
  getChannelPageById,
  getPageContentForEditPage,
  isChannelAuthor,
} from "@/actions/channels";
import { getCurrentUser } from "@/actions";
import EditPageForm from "./edit-page-form";

type Props = { params: Promise<{ channelSlug: string; pageId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { channelSlug, pageId } = await params;
  const channel = await getChannelBySlug(channelSlug);
  if (!channel) return { title: "Edit page" };
  const page = await getChannelPageById(channel.id, pageId);
  if (!page) return { title: "Edit page" };
  return { title: `Edit · ${page.title}` };
}

export default async function EditChannelPage({ params }: Props) {
  const { channelSlug, pageId } = await params;

  const [channel, user] = await Promise.all([
    getChannelBySlug(channelSlug),
    getCurrentUser(),
  ]);

  if (!channel) notFound();
  if (!user) redirect(`/auth/login?next=/channel/${channelSlug}/pages/${pageId}/edit`);

  const [page, author] = await Promise.all([
    getChannelPageById(channel.id, pageId),
    isChannelAuthor(channel.id),
  ]);

  if (!page) notFound();
  if (!author) redirect(`/channel/${channelSlug}`);

  const pageContent = await getPageContentForEditPage(channel.id, page);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        <Link
          href={page.slug === "home" ? `/channel/${channelSlug}` : `/channel/${channelSlug}/${page.slug}`}
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          ← Back to page
        </Link>
      </p>
      <EditPageForm
        channelId={channel.id}
        channelSlug={channelSlug}
        page={page}
        pageContent={pageContent}
      />
    </div>
  );
}
