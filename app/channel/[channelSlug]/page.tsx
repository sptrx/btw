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

  return (
    <div>
      {homePage?.description && (
        <div className="btw-content-panel mb-6">
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
            className="btw-app-row"
          >
            <h3 className="font-medium">{item.title}</h3>
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
          className="btw-callout-section"
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
