import Link from "next/link";
import { BookOpen, MessageCircle } from "lucide-react";
import type { BibleAiNavLink } from "@/lib/bible-ai-config";

export type RailPrayer = {
  id: string;
  title: string;
};

export type PopularChannel = {
  id: string;
  title: string;
  slug: string;
  follower_count: number;
};

/** Hide empty counts: "0 followers" on every row reads as an empty community. */
function followerLabel(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) return "1 follower";
  return `${count} followers`;
}

export function SiteRightRail({
  channels,
  prayers,
  bibleQa,
}: {
  channels: PopularChannel[];
  prayers: RailPrayer[];
  bibleQa: BibleAiNavLink | null;
}) {
  const qaHref = bibleQa?.href ?? "/ask";
  const qaExternal = bibleQa?.external ?? false;

  return (
    <aside className="sticky top-[calc(var(--header-bar-height)+0.75rem)] hidden max-h-[calc(100dvh-var(--header-bar-height)-1.5rem)] space-y-3 overflow-y-auto xl:block">
      <section className="rounded-xl border border-border/70 bg-card p-3 shadow-sm">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Popular channels
        </h2>
        {channels.length === 0 ? (
          <p className="px-1 py-3 text-sm text-muted-foreground">No channels yet.</p>
        ) : (
          <ul className="mt-1">
            {channels.map((channel) => (
              <li key={channel.id}>
                <Link
                  href={`/channel/${channel.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 hover:bg-muted"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {channel.title}
                  </span>
                  {followerLabel(channel.follower_count) ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {followerLabel(channel.follower_count)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/channel/browse"
          className="mt-1 inline-flex px-1 text-sm font-medium text-primary hover:underline"
        >
          Browse all channels
        </Link>
      </section>

      <section className="rounded-xl border border-border/70 bg-card p-3 shadow-sm">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Prayer wall
        </h2>
        {prayers.length === 0 ? (
          <p className="px-1 py-3 text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <ul className="mt-1">
            {prayers.map((prayer) => (
              <li key={prayer.id}>
                <Link
                  href={`/prayer/${prayer.id}`}
                  className="block truncate rounded-lg px-1 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {prayer.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/prayer"
          className="mt-1 inline-flex px-1 text-sm font-medium text-primary hover:underline"
        >
          Open the prayer wall
        </Link>
      </section>

      <Link
        href="/bible"
        className="block rounded-xl border border-border/70 bg-card p-3 shadow-sm transition-colors hover:bg-muted/60"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BookOpen className="size-4 text-primary" aria-hidden />
          Bible
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          Read a chapter of Scripture.
        </span>
      </Link>

      {qaExternal ? (
        <a
          href={qaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-border/70 bg-card p-3 shadow-sm transition-colors hover:bg-muted/60"
        >
          <QaBody />
        </a>
      ) : (
        <Link
          href={qaHref}
          className="block rounded-xl border border-border/70 bg-card p-3 shadow-sm transition-colors hover:bg-muted/60"
        >
          <QaBody />
        </Link>
      )}
    </aside>
  );
}

function QaBody() {
  return (
    <>
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MessageCircle className="size-4 text-primary" aria-hidden />
        Bible Q&amp;A
      </span>
      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
        Ask about a passage, theme, or verse.
      </span>
    </>
  );
}
