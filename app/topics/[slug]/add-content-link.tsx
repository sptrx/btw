"use client";

import Link from "next/link";

type Props = { topicId: string; slug: string };

export default function AddContentLink({ topicId, slug }: Props) {
  return (
    <Link
      href={`/topics/${slug}/content/new`}
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    >
      Add content
    </Link>
  );
}
