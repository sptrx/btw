"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/actions/channels";
import { ContentSubmissionDisclaimer } from "@/components/content-submission-disclaimer";

type Props = { contentId: string };

export default function CommentForm({ contentId }: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const router = useRouter();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        if (!acceptedDisclaimer) {
          setError("Please accept the content disclaimer before commenting.");
          return;
        }
        setLoading(true);
        setError(null);
        const res = await addComment(contentId, body.trim());
        setLoading(false);
        if (res?.error) setError(res.error);
        else {
          setBody("");
          router.refresh();
        }
      }}
      className="mb-6"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
      />
      <div className="mt-3">
        <ContentSubmissionDisclaimer
          id="comment-disclaimer"
          checked={acceptedDisclaimer}
          onCheckedChange={setAcceptedDisclaimer}
          variant="compact"
        />
      </div>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      <button
        type="submit"
        disabled={loading || !body.trim() || !acceptedDisclaimer}
        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Posting..." : "Comment"}
      </button>
    </form>
  );
}
