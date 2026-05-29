import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/actions";
import { getPrayerRequestById, getPrayerComments } from "@/actions/prayer";
import { PrayerCommentForm } from "@/components/prayer/prayer-comment-form";
import { PrayerCommentList } from "@/components/prayer/prayer-comment-list";
import { MarkAnsweredForm } from "@/components/prayer/mark-answered-form";
import { PrayingButton } from "@/components/prayer/praying-button";
import { RelativeDate } from "@/components/relative-date";
import { btwDisplayFont, btwProse } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PrayerRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const [user, request, comments] = await Promise.all([
    getCurrentUser(),
    getPrayerRequestById(id),
    getPrayerComments(id),
  ]);

  if (!request) notFound();

  const isAuthenticated = !!user;
  const author =
    request.authorDisplayName?.trim() ||
    (request.isAnonymous ? "A sister/brother in Christ" : "Community member");

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 sm:px-5 sm:py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/prayer" className="hover:text-primary hover:underline">
          Prayer Wall
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground line-clamp-1">{request.title}</span>
      </nav>

      <article className="space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{author}</span>
            <span aria-hidden>·</span>
            <RelativeDate date={request.createdAt} className="tabular-nums" />
            {request.status === "answered" ? (
              <span className="btw-overline rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                Answered
              </span>
            ) : null}
          </div>
          <h1 className={cn(btwDisplayFont, "text-2xl font-normal sm:text-3xl text-foreground")}>
            {request.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <PrayingButton
              prayerRequestId={request.id}
              initialCount={request.prayerCount}
              initialPraying={request.userIsPraying}
              isAuthenticated={isAuthenticated}
              size="default"
            />
            {request.isOwner && request.status === "active" ? (
              <MarkAnsweredForm prayerRequestId={request.id} />
            ) : null}
          </div>
        </header>

        <div className={cn(btwProse, "text-foreground whitespace-pre-wrap")}>{request.body}</div>

        <section className="border-t border-border/80 pt-8" aria-labelledby="encouragement-heading">
          <h2 id="encouragement-heading" className="text-lg font-medium text-foreground mb-4">
            Encouragement
          </h2>
          <PrayerCommentForm prayerRequestId={request.id} isAuthenticated={isAuthenticated} />
          <div className="mt-6">
            <PrayerCommentList comments={comments} />
          </div>
        </section>
      </article>
    </div>
  );
}
