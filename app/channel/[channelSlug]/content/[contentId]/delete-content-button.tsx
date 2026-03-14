"use client";

import { deleteContent } from "@/actions/channels";

type Props = { contentId: string };

export default function DeleteContentButton({ contentId }: Props) {
  return (
    <form action={deleteContent.bind(null, contentId)}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Delete this content?")) e.preventDefault();
        }}
        className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Delete content
      </button>
    </form>
  );
}
