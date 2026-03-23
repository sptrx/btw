import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getChannelBySlug,
  getChannelPage,
  getPageContent,
  isChannelAuthor,
} from "@/actions/channels";
import { Button } from "@/components/ui/button";
import AddContentLink from "../add-content-link";
import { DeletePageButton } from "../delete-page-button";

type Props = { params: Promise<{ channelSlug: string; pageSlug: string }> };

export default async function ChannelSubPage({ params }: Props) {
  const { channelSlug, pageSlug } = await params;

  if (pageSlug === "home") {
    redirect(`/channel/${channelSlug}`);
  }

  const channel = await getChannelBySlug(channelSlug);
  if (!channel) notFound();

  const page = await getChannelPage(channel.id, pageSlug);
  if (!page) notFound();

  const [content, isAuthor] = await Promise.all([
    getPageContent(channel.id, page.id),
    isChannelAuthor(channel.id),
  ]);

  const typeLabels: Record<string, string> = {
    video: "Video",
    podcast: "Podcast",
    article: "Article",
    discussion: "Discussion",
  };

  return (
    <div>
      <div className="border border-border rounded-2xl p-4 sm:p-6 mb-6 bg-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{page.title}</h1>
            {page.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{page.description}</p>
            )}
          </div>
          {isAuthor && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="touch-manipulation" asChild>
                <Link href={`/channel/${channelSlug}/pages/${page.id}/edit`}>Edit page</Link>
              </Button>
              <DeletePageButton
                channelId={channel.id}
                pageId={page.id}
                pageTitle={page.title}
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {content.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">No content yet.</p>
        )}
        {content.map((item) => (
          <Link
            key={item.id}
            href={`/channel/${channelSlug}/content/${item.id}`}
            className="block border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
              {typeLabels[item.type] ?? item.type}
            </span>
            <h3 className="font-medium mt-2">{item.title}</h3>
            {item.body && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.body}
              </p>
            )}
          </Link>
        ))}
      </div>

      {isAuthor && (
        <section
          className="mt-8 rounded-xl border-2 border-primary/25 bg-primary/5 p-6 shadow-sm"
          aria-labelledby="channel-subpage-add-content-heading"
        >
          <h2 id="channel-subpage-add-content-heading" className="text-lg font-semibold mb-2">
            Add content
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Publish a new post on <span className="font-medium text-foreground">{page.title}</span> (you can change the page on the next step).
          </p>
          <AddContentLink
            pageId={page.id}
            channelSlug={channelSlug}
            label="+ Add content to this page"
          />
        </section>
      )}
    </div>
  );
}
