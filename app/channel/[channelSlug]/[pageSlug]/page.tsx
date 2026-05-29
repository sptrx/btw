import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getChannelBySlug,
  getChannelPage,
  getPageContent,
  isChannelAuthor,
} from "@/actions/channels";
import { Button } from "@/components/ui/button";
import { ChannelPageContentList } from "@/components/channel-page-content-list";
import { ChannelContentFilterSection } from "@/components/channel-content-filter-section";
import AddContentLink from "../add-content-link";
import { DeletePageButton } from "../delete-page-button";
import { isSharingType, type SharingType } from "@/lib/sharing-types";

type Props = {
  params: Promise<{ channelSlug: string; pageSlug: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function ChannelSubPage({ params, searchParams }: Props) {
  const { channelSlug, pageSlug } = await params;
  const sp = await searchParams;
  const typeFilter =
    sp.type && isSharingType(sp.type) ? (sp.type as SharingType) : undefined;

  if (pageSlug === "home") {
    redirect(`/channel/${channelSlug}`);
  }

  const channel = await getChannelBySlug(channelSlug);
  if (!channel) notFound();

  const page = await getChannelPage(channel.id, pageSlug);
  if (!page) notFound();

  const isAuthor = await isChannelAuthor(channel.id);
  const content = await getPageContent(channel.id, page.id, {
    includeNonApproved: isAuthor,
    sharingType: typeFilter,
  });

  return (
    <div>
      <div className="btw-content-panel mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="btw-page-title-sm">{page.title}</h1>
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

      <ChannelContentFilterSection channelSlug={channelSlug} pageSlug={pageSlug} />
      <ChannelPageContentList
        channelSlug={channelSlug}
        items={content}
        showPage={false}
        emptyMessage="No content on this page yet."
      />

      {isAuthor && (
        <section
          className="btw-callout-section"
          aria-labelledby="channel-subpage-add-content-heading"
        >
          <h2 id="channel-subpage-add-content-heading" className="btw-section-title mb-2">
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
