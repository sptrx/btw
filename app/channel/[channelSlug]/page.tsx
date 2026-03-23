import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getChannelBySlug,
  getChannelPages,
  getPageContent,
  getPageContentForEditPage,
  isChannelAuthor,
} from "@/actions/channels";
import AddContentLink from "./add-content-link";

type Props = { params: Promise<{ channelSlug: string }> };

export default async function ChannelPage({ params }: Props) {
  const { channelSlug } = await params;

  const channel = await getChannelBySlug(channelSlug);
  if (!channel) notFound();

  const pages = await getChannelPages(channel.id);
  const homePage = pages.find((p) => p.slug === "home");
  const content = homePage
    ? await getPageContentForEditPage(channel.id, homePage)
    : await getPageContent(channel.id, null);

  const isAuthor = await isChannelAuthor(channel.id);
  const defaultPageIdForContent = homePage?.id ?? pages[0]?.id ?? null;

  const typeLabels: Record<string, string> = {
    video: "Video",
    podcast: "Podcast",
    article: "Article",
    discussion: "Discussion",
  };

  return (
    <div>
      {homePage?.description && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{homePage.description}</p>
        </div>
      )}
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
          aria-labelledby="channel-home-add-content-heading"
        >
          <h2 id="channel-home-add-content-heading" className="text-lg font-semibold mb-2">
            Add content
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Publish a new post to this channel (you can pick the page on the next step).
          </p>
          <AddContentLink
            pageId={defaultPageIdForContent}
            channelSlug={channelSlug}
            label="+ Add content to this page"
          />
        </section>
      )}
    </div>
  );
}
