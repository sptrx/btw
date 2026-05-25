import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/actions";
import { getModerationOverview } from "@/actions/moderation-admin";
import { ModerationReviewActions } from "@/components/moderation-review-actions";
import { RelativeDate } from "@/components/relative-date";
import { isSiteModerator } from "@/lib/site-roles";

export const metadata: Metadata = {
  title: "Moderation",
  description: "Review pending posts and member reports",
};

export default async function ModerationDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/dashboard/moderation");

  const profile = await getProfile(user.id);
  if (!isSiteModerator(profile?.role)) redirect("/dashboard");

  const overview = await getModerationOverview();
  if ("error" in overview) {
    return (
      <div>
        <h1 className="btw-page-title">Moderation</h1>
        <p className="mt-4 text-sm text-destructive">{overview.error}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="btw-section-eyebrow">Site staff</p>
      <h1 className="btw-page-title">Moderation</h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        Approve testimony-focused posts and triage member reports. Assign the moderator role in Supabase (
        <code className="text-xs">profiles.role = &apos;moderator&apos;</code>).
      </p>

      <section aria-labelledby="mod-queue-heading" className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="mod-queue-heading" className="text-lg font-semibold">
            Review queue
          </h2>
          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium tabular-nums">
            {overview.pendingCount} pending
          </span>
        </div>

        {overview.queue.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No posts waiting for review.
          </div>
        ) : (
          <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
            {overview.queue.map((item) => (
              <li key={item.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>{item.channelTitle}</span>
                      <span aria-hidden>·</span>
                      <span>{item.typeLabel}</span>
                      <span aria-hidden>·</span>
                      <RelativeDate date={item.createdAt} className="tabular-nums" />
                    </div>
                    <Link href={item.href} className="mt-1 block text-base font-medium hover:text-primary">
                      {item.title}
                    </Link>
                    {item.bodySnippet ? (
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.bodySnippet}</p>
                    ) : null}
                    <Link href={item.href} className="mt-2 inline-flex text-sm text-primary hover:underline">
                      Open post
                    </Link>
                  </div>
                  <ModerationReviewActions contentId={item.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mod-reports-heading">
        <h2 id="mod-reports-heading" className="mb-4 text-lg font-semibold">
          Recent reports
        </h2>

        {overview.reports.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No member reports yet.
          </div>
        ) : (
          <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
            {overview.reports.map((report) => (
              <li key={report.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      Reported by {report.reporterName}
                      {" · "}
                      <RelativeDate date={report.createdAt} className="tabular-nums" />
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">{report.reasonLabel}</p>
                    <Link href={report.href} className="mt-1 block text-sm hover:text-primary">
                      {report.contentTitle}
                    </Link>
                    {report.details ? (
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{report.details}</p>
                    ) : null}
                  </div>
                  <ModerationReviewActions contentId={report.contentId} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
