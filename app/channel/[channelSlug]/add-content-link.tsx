"use client";

import Link from "next/link";

type Props = { channelId: string; pageId: string | null; channelSlug: string };

export default function AddContentLink({ channelId, pageId, channelSlug }: Props) {
  const pageParam = pageId ? `?page=${pageId}` : "";
  return (
    <Link
      href={`/channel/${channelSlug}/content/new${pageParam}`}
      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    >
      + Add content
    </Link>
  );
}
