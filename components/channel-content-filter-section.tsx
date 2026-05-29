"use client";

import { Suspense } from "react";
import { ChannelContentTypeFilter } from "@/components/channel-content-type-filter";

function FilterInner(props: { channelSlug: string; pageSlug?: string }) {
  return <ChannelContentTypeFilter {...props} />;
}

export function ChannelContentFilterSection(props: { channelSlug: string; pageSlug?: string }) {
  return (
    <Suspense fallback={null}>
      <FilterInner {...props} />
    </Suspense>
  );
}
