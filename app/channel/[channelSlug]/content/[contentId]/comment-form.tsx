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
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
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
            ? "border-primary/50 bg-primary/10"
            : "border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            id="comment-request-scripture-guide"
            type="checkbox"
            checked={requestScriptureGuide}
            onChange={(e) => setRequestScriptureGuide(e.target.checked)}
            className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Add a Scripture guide reply
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                AI
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Opt in to receive a thoughtful, scripture-grounded reply alongside your comment.
              Powered by the bible-ai service &mdash; may take a few seconds after your comment posts.
            </p>
          </div>
        </div>
      </label>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      {info && (
        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {info}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !body.trim() || !effectiveAccepted}
        className="mt-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Posting..." : "Comment"}
      </button>
    </form>
  );
}
