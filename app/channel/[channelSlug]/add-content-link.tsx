"use client";

import Link from "next/link";

type Props = {
  pageId: string | null;
  channelSlug: string;
  /** Defaults to “Add content to this page” for in-context use; use a different label on settings, etc. */
  label?: string;
};

export default function AddContentLink({
  pageId,
  channelSlug,
  label = "+ Add content to this page",
}: Props) {
  const pageParam = pageId ? `?page=${pageId}` : "";
  return (
    <Link
      href={`/channel/${channelSlug}/content/new${pageParam}`}
      className="block w-full text-center px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
    >
      {label}
    </Link>
  );
}
