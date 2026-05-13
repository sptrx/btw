"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { addComment } from "@/actions/channels";
import {
  ContentSubmissionDisclaimer,
  ContentSubmissionDisclaimerAccepted,
} from "@/components/content-submission-disclaimer";

type Props = {
  contentId: string;
  /** True when the user already agreed to the disclaimer on a prior submission.
   *  When true we skip the per-comment checkbox -- acceptance is recorded once
   *  on the profile and silently re-applied here. */
  hasAlreadyAcceptedDisclaimer?: boolean;
};

export default function CommentForm({
  contentId,
  hasAlreadyAcceptedDisclaimer = false,
}: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [requestScriptureGuide, setRequestScriptureGuide] = useState(false);
  const router = useRouter();

  const effectiveAccepted = hasAlreadyAcceptedDisclaimer || acceptedDisclaimer;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        if (!effectiveAccepted) {
          setError("Please accept the content disclaimer before commenting.");
          return;
        }
        setLoading(true);
        setError(null);
        setInfo(null);
        const res = await addComment(contentId, body.trim(), {
          requestScriptureGuide,
          acceptedDisclaimer: effectiveAccepted,
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
      {hasAlreadyAcceptedDisclaimer ? (
        <div className="mt-3">
          <ContentSubmissionDisclaimerAccepted variant="compact" />
        </div>
      ) : (
        <div className="mt-3">
          <ContentSubmissionDisclaimer
            id="comment-disclaimer"
            checked={acceptedDisclaimer}
            onCheckedChange={setAcceptedDisclaimer}
            variant="compact"
          />
        </div>
      )}
      <label
        htmlFor="comment-request-scripture-guide"
        className={`mt-4 block cursor-pointer rounded-xl border-2 px-4 py-3 transition-colors ${
          requestScriptureGuide
            ? "border-indigo-500 bg-indigo-50/80 dark:border-indigo-400 dark:bg-indigo-950/40"
            : "border-dashed border-indigo-300 bg-indigo-50/30 hover:border-indigo-400 hover:bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-950/20 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            id="comment-request-scripture-guide"
            type="checkbox"
            checked={requestScriptureGuide}
            onChange={(e) => setRequestScriptureGuide(e.target.checked)}
            className="mt-1 size-4 shrink-0 rounded border-indigo-400 accent-indigo-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              <Sparkles className="size-4 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
              Add a Scripture guide reply
              <span className="ml-1 rounded-full bg-indigo-200/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-800 dark:bg-indigo-800/60 dark:text-indigo-100">
                AI
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
              Opt in to receive a thoughtful, scripture-grounded reply alongside your comment.
              Powered by the bible-ai service &mdash; may take a few seconds after your comment posts.
            </p>
          </div>
        </div>
      </label>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      {info && (
        <p className="text-amber-800 dark:text-amber-200 text-sm mt-2 whitespace-pre-wrap border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 bg-amber-50 dark:bg-amber-950/40">
          {info}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !body.trim() || !effectiveAccepted}
        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Posting..." : "Comment"}
      </button>
    </form>
  );
}
