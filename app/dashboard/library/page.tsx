import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Footprints } from "lucide-react";
import { getCurrentUser } from "@/actions";
import { getUserLibrary } from "@/actions/library";
import { RelativeDate } from "@/components/relative-date";
import { LIBRARY_LABELS } from "@/lib/library-vocabulary";

export const metadata: Metadata = {
  title: "Your library",
  description: "Channels you walk with and posts you keep",
};

function cardImageUnoptimized(src: string) {
  return !src.includes("images.unsplash.com");
}

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/dashboard/library");

  const library = await getUserLibrary(user.id);

  return (
    <div>
      <p className="btw-section-eyebrow">Saved for you</p>
      <h1 className="btw-page-title">{LIBRARY_LABELS.pageTitle}</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{LIBRARY_LABELS.pageDescription}</p>

      <section aria-labelledby="library-walking-with" className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Footprints className="size-5 text-primary" aria-hidden />
          <h2 id="library-walking-with" className="text-lg font-semibold">
            {LIBRARY_LABELS.walkWith.section}
          </h2>
        </div>

        {library.walkingWith.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <p>You are not walking with any channels yet.</p>
            <Link href="/channel/browse" className="mt-3 inline-flex font-medium text-primary hover:underline">
              Browse channels
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
            {library.walkingWith.map((ch) => (
              <li key={ch.topicId}>
                <Link
                  href={`/channel/${ch.slug}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5"
                >
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                    {ch.coverImageUrl ? (
                      <Image
                        src={ch.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="44px"
                        unoptimized={cardImageUnoptimized(ch.coverImageUrl)}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                        {ch.title.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{ch.title}</span>
                    {ch.description ? (
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {ch.description}
                      </span>
                    ) : null}
                  </span>
                  <RelativeDate date={ch.walkedSince} className="shrink-0 text-xs text-muted-foreground tabular-nums" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="library-kept">
        <div className="mb-4 flex items-center gap-2">
          <Bookmark className="size-5 text-primary" aria-hidden />
          <h2 id="library-kept" className="text-lg font-semibold">
            {LIBRARY_LABELS.keep.section}
          </h2>
        </div>

        {library.kept.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <p>Posts you keep will appear here so you can revisit them anytime.</p>
            <Link href="/" className="mt-3 inline-flex font-medium text-primary hover:underline">
              Explore the home timeline
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
            {library.kept.map((post) => (
              <li key={post.contentId}>
                <Link
                  href={post.href}
                  className="block px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{post.channelTitle}</span>
                    <span aria-hidden>·</span>
                    <span>{post.typeLabel}</span>
                    <span aria-hidden>·</span>
                    <RelativeDate date={post.savedAt} className="tabular-nums" />
                  </div>
                  <p className="mt-1 text-base font-medium text-foreground">{post.title}</p>
                  {post.bodySnippet ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.bodySnippet}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
