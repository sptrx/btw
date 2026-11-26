import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PersonalizedHomeData } from "@/actions/personalized-home";
import { RelativeDate } from "@/components/relative-date";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  data: PersonalizedHomeData;
  displayFontClassName: string;
};

export function PersonalizedHome({ data, displayFontClassName }: Props) {
  return (
    <div className="space-y-10 pb-8">
      <header className="space-y-2">
        <p className="btw-overline text-primary">Your home</p>
        <h1 className={cn(displayFontClassName, "text-3xl sm:text-4xl")}>
          Welcome back, {data.displayName}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Channels you walk with, prayer close to you, and a verse for today.
        </p>
      </header>

      <section
        className="rounded-2xl border border-border bg-card px-5 py-6 text-card-foreground shadow-sm sm:px-7"
        aria-labelledby="daily-verse-heading"
      >
        <p id="daily-verse-heading" className="btw-overline text-primary">
          Today&apos;s verse
        </p>
        <blockquote
          className={cn(
            displayFontClassName,
            "mt-3 max-w-3xl text-xl font-normal leading-relaxed text-foreground sm:text-2xl"
          )}
        >
          {data.verse.text}
        </blockquote>
        <p className="mt-3 text-sm font-medium text-primary">{data.verse.reference}</p>
      </section>

      <section aria-labelledby="followed-channels-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="followed-channels-heading" className="btw-section-title">
            Channels you walk with
          </h2>
          <Link href="/channel/browse" className="text-sm font-medium text-primary hover:underline">
            Browse
          </Link>
        </div>
        {data.channels.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            You are not walking with a channel yet.{" "}
            <Link href="/channel/browse" className="font-medium text-primary hover:underline">
              Find one
            </Link>{" "}
            and their posts will show up here.
          </p>
        ) : (
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {data.channels.map((channel) => (
              <li key={channel.slug} className="w-56 shrink-0">
                <Link
                  href={`/channel/${channel.slug}`}
                  className="block h-full rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium">
                    {channel.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={channel.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      channel.title.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="mt-3 block truncate font-medium text-foreground">
                    {channel.title}
                  </span>
                  {channel.description ? (
                    <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                      {channel.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="nearby-prayer-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="nearby-prayer-heading" className="btw-section-title">
              Prayer requests
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/prayer">
              Prayer
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
        {data.prayers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open requests right now.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {data.prayers.map((prayer) => (
              <li key={prayer.id}>
                <Link href={`/prayer/${prayer.id}`} className="block px-4 py-3 hover:bg-muted/40">
                  <span className="font-medium text-foreground">{prayer.title}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <RelativeDate date={prayer.createdAt} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Back to home
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </p>
    </div>
  );
}
