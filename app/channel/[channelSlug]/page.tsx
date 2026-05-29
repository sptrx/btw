import { notFound } from "next/navigation";
import {
  getChannelBySlug,
  getChannelPages,
  getPageContent,
  getPageContentForEditPage,
  isChannelAuthor,
} from "@/actions/channels";
import AddContentLink from "./add-content-link";
import { ShareButton } from "@/components/share-button";
import { ChannelPageContentList } from "@/components/channel-page-content-list";
import { ChannelContentFilterSection } from "@/components/channel-content-filter-section";
import { getCurrentUser } from "@/actions";
import { isSharingType, type SharingType } from "@/lib/sharing-types";

type Props = {
  params: Promise<{ channelSlug: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function ChannelPage({ params, searchParams }: Props) {
  const { channelSlug } = await params;
  const sp = await searchParams;
  const typeFilter =
    sp.type && isSharingType(sp.type) ? (sp.type as SharingType) : undefined;

  const channel = await getChannelBySlug(channelSlug);
  if (!channel) notFound();

  const pages = await getChannelPages(channel.id);
  const homePage = pages.find((p) => p.slug === "home");
  const isAuthor = await isChannelAuthor(channel.id);
  const contentOptions = {
    includeNonApproved: isAuthor,
    sharingType: typeFilter,
  };
  const content = homePage
    ? await getPageContentForEditPage(channel.id, homePage, contentOptions)
    : await getPageContent(channel.id, null, contentOptions);

  const user = await getCurrentUser();
  const defaultPageIdForContent = homePage?.id ?? pages[0]?.id ?? null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <ShareButton
          path={`/channel/${channelSlug}`}
          title={channel.title}
          text={channel.description ?? `Check out ${channel.title} on BTW`}
          isAuthenticated={!!user}
        />
      </div>
      {homePage?.description && (
        <div className="btw-content-panel mb-6">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{homePage.description}</p>
        </div>
      )}

      <ChannelContentFilterSection channelSlug={channelSlug} />
      <ChannelPageContentList channelSlug={channelSlug} items={content} showPage />

      {isAuthor && (
        <section
          className="btw-callout-section mt-14 pt-10 border-t border-border/60"
          aria-labelledby="channel-home-add-content-heading"
        >
          <h2 id="channel-home-add-content-heading" className="btw-section-title mb-2">
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
