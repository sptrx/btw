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
        className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        Delete content
      </button>
    </form>
  );
}
