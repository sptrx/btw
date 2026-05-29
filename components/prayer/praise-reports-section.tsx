import Link from "next/link";
import type { PraiseReportItem } from "@/actions/prayer";
import { RelativeDate } from "@/components/relative-date";
import { cn } from "@/lib/utils";

type Props = {
  reports: PraiseReportItem[];
  displayFontClassName?: string;
};

export function PraiseReportsSection({ reports, displayFontClassName }: Props) {
  if (reports.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16" aria-labelledby="praise-reports-heading">
      <div className="mb-6 space-y-1">
        <h2
          id="praise-reports-heading"
          className={cn(displayFontClassName, "text-2xl font-normal text-foreground sm:text-3xl")}
        >
          Praise Reports
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          Celebrating how God has answered prayer in our community.
        </p>
      </div>
      <ul className="space-y-4">
        {reports.map((report) => (
          <li
            key={report.id}
            className="rounded-xl border border-border/80 bg-card/50 px-4 py-4 sm:px-5 sm:py-5"
          >
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {report.body}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {report.authorDisplayName?.trim() || "Community member"}
              </span>
              <span aria-hidden>·</span>
              <RelativeDate date={report.createdAt} className="tabular-nums" />
              {report.prayerRequestId && report.prayerRequestTitle ? (
                <>
                  <span aria-hidden>·</span>
                  <Link
                    href={`/prayer/${report.prayerRequestId}`}
                    className="text-primary hover:underline"
                  >
                    Re: {report.prayerRequestTitle}
                  </Link>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
