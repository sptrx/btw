"use client";

import { archiveChannel, unarchiveChannel } from "@/actions/channels";
import { ArchiveToggle } from "@/components/archive-toggle";

export function ChannelArchiveSection({
  channelId,
  archived,
}: {
  channelId: string;
  archived: boolean;
}) {
  return (
    <ArchiveToggle
      kind="channel"
      archived={archived}
      onArchive={() => archiveChannel(channelId)}
      onUnarchive={() => unarchiveChannel(channelId)}
    />
  );
}
