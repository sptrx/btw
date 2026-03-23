"use client";

import Link from "next/link";

type Props = { channelId: string; channelSlug: string };

export default function AddPageLink({ channelId, channelSlug }: Props) {
  return (
    <Link
      href={`/channel/${channelSlug}/pages/new`}
      className="block w-full text-center px-3 py-2 text-sm border border-dashed border-border rounded-lg hover:bg-muted transition-colors"
    >
      + Add new page to this channel
    </Link>
  );
}
