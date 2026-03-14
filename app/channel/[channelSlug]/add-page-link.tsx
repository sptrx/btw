"use client";

import Link from "next/link";

type Props = { channelId: string; channelSlug: string };

export default function AddPageLink({ channelId, channelSlug }: Props) {
  return (
    <Link
      href={`/channel/${channelSlug}/pages/new`}
      className="px-3 py-1 border border-dashed rounded hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      + Add page
    </Link>
  );
}
