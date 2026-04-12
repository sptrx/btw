"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/actions/channels";
import { ContentSubmissionDisclaimer } from "@/components/content-submission-disclaimer";

type Props = { contentId: string };

export default function CommentForm({ contentId }: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [requestScriptureGuide, setRequestScriptureGuide] = useState(false);
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
        setInfo(null);
        const res = await addComment(contentId, body.trim(), {
          requestScriptureGuide,
        });
        setLoading(false);
        if (res?.error) setError(res.error);
        else {
          setBody("");
          setRequestScriptureGuide(false);
          if ("guideError" in res && res.guideError) {
            setInfo(res.guideError);
          }
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
      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={requestScriptureGuide}
          onChange={(e) => setRequestScriptureGuide(e.target.checked)}
          className="mt-1 rounded border-gray-300"
        />
        <span>
          Request a <strong className="font-medium">Scripture guide</strong> reply (uses the
          bible-ai service; may take a few seconds after your comment posts).
        </span>
      </label>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      {info && (
        <p className="text-amber-800 dark:text-amber-200 text-sm mt-2 whitespace-pre-wrap border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 bg-amber-50 dark:bg-amber-950/40">
          {info}
        </p>
      )}
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
