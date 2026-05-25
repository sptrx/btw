"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { reportContent } from "@/actions/reports";
import { REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";

type Props = {
  contentId: string;
  channelSlug: string;
  isAuthenticated: boolean;
};

export function ReportContentButton({ contentId, channelSlug, isAuthenticated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("off_mission");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginHref = `/auth/login?next=${encodeURIComponent(
    `/channel/${channelSlug}/content/${contentId}`
  )}`;

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await reportContent(contentId, channelSlug, reason, details);
    setLoading(false);
    if (!res || "error" in res) {
      setError(res?.error ?? "Could not submit report.");
      return;
    }
    setMessage("Thank you. We received your report.");
    setOpen(false);
    setDetails("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            router.push(loginHref);
            return;
          }
          setOpen((v) => !v);
          setMessage(null);
          setError(null);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Flag className="size-3.5" aria-hidden />
        Report
      </button>

      {message ? (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-border bg-popover p-4 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">Report this post</p>
          <label className="block text-xs font-medium text-muted-foreground mb-1" htmlFor="report-reason">
            Reason
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {REPORT_REASONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label className="block text-xs font-medium text-muted-foreground mb-1" htmlFor="report-details">
            Details (optional)
          </label>
          <textarea
            id="report-details"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="What feels off mission?"
          />
          {error ? (
            <p className="mb-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {loading ? "Sending…" : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
