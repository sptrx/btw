"use client";

import { archiveChannelPage, unarchiveChannelPage } from "@/actions/channels";
import { ArchiveToggle } from "@/components/archive-toggle";

export function PageArchiveSection({
  channelId,
  pageId,
  archived,
}: {
  channelId: string;
  pageId: string;
  archived: boolean;
}) {
  return (
    <div className="max-w-lg space-y-3 rounded-2xl border border-border bg-card p-6">
      <h2 className="btw-section-title">{archived ? "This page is archived" : "Archive this page"}</h2>
      <ArchiveToggle
        kind="page"
        archived={archived}
        onArchive={() => archiveChannelPage(channelId, pageId)}
        onUnarchive={() => unarchiveChannelPage(channelId, pageId)}
      />
    </div>
  );
}
