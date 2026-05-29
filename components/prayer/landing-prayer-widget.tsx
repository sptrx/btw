import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PrayerRequestListItem } from "@/actions/prayer";
import { truncateBody } from "@/lib/prayer-display";
import { Button } from "@/components/ui/button";
import { RelativeDate } from "@/components/relative-date";
import { cn } from "@/lib/utils";

type Props = {
  requests: PrayerRequestListItem[];
  displayFontClassName?: string;
};

export function LandingPrayerWidget({ requests, displayFontClassName }: Props) {
  if (requests.length === 0) return null;

  return (
    <section
      className="py-10 sm:py-12 md:py-14 border-y border-border/60 bg-background"
      aria-labelledby="landing-prayer-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div className="space-y-1">
            <p className="btw-overline text-primary">Prayer Wall</p>
            <h2
              id="landing-prayer-heading"
              className={cn(displayFontClassName, "text-2xl font-normal sm:text-3xl")}
            >
              Pray with us
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg">
              Lift up these recent requests from brothers and sisters in Christ.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full shrink-0">
            <Link href="/prayer">
              View Prayer Wall
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {requests.map((req) => (
            <li key={req.id}>
              <Link
                href={`/prayer/${req.id}`}
                className="block h-full rounded-xl border border-border/80 bg-muted/20 px-4 py-4 transition-colors hover:bg-muted/40 hover:border-border"
              >
                <h3 className="font-medium text-foreground line-clamp-2 text-sm sm:text-base">
                  {req.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {truncateBody(req.body, 120)}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  <RelativeDate date={req.createdAt} className="tabular-nums" />
                  {req.prayerCount > 0 ? (
                    <span className="ml-2">
                      · <span aria-hidden>🙏</span> {req.prayerCount} praying
                    </span>
                  ) : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-center sm:hidden">
          <Button asChild className="rounded-full">
            <Link href="/prayer">Pray with us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
