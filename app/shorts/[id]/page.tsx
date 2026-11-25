import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/actions";
import { getShort } from "@/actions/shorts";
import { getPostReactions } from "@/actions/reactions";
import { emptyReactionCounts } from "@/lib/post-reactions";
import { ShortPlayer } from "@/components/shorts/short-player";
import { PostReactions } from "@/components/post-reactions";
import { RelativeDate } from "@/components/relative-date";
import { pageMetadata, privatePageMetadata } from "@/lib/seo";
import { profilePath } from "@/lib/profile-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const short = await getShort(id);
  if (!short) return privatePageMetadata("Short");
  const title = short.caption.trim() || `A short from ${short.authorName}`;
  if (short.status !== "approved") return privatePageMetadata(title);
  return pageMetadata({
    title,
    description: short.caption || "A short testimony on Believe The Works.",
    path: `/shorts/${short.id}`,
    image: short.posterUrl ?? undefined,
    type: "article",
  });
}

export default async function ShortPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [short, user] = await Promise.all([getShort(id), getCurrentUser()]);
  if (!short) notFound();

  const isOwner = user?.id === short.authorId;
  const reactionState =
    short.status === "approved"
      ? (await getPostReactions([{ postId: short.id, postKind: "short" }])).get(`short:${short.id}`)
      : undefined;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <article className="overflow-hidden rounded-2xl border border-border bg-card">
        <ShortPlayer
          playerUrl={short.playerUrl}
          posterUrl={short.posterUrl}
          controls
          eager
          className="rounded-t-2xl"
        />
        <div className="space-y-2 p-4">
          <p className="text-sm font-medium">
            {short.authorUsername ? (
              <Link
                href={profilePath({ id: short.authorId, username: short.authorUsername })}
                className="hover:underline"
              >
                {short.authorName}
              </Link>
            ) : (
              short.authorName
            )}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              <RelativeDate date={short.createdAt} className="tabular-nums" />
            </span>
          </p>
          {short.caption ? <p className="text-sm whitespace-pre-wrap">{short.caption}</p> : null}
          {short.status !== "approved" ? (
            <p className="text-xs text-muted-foreground">
              {isOwner
                ? "Only you can see this short until it's approved."
                : "This short isn't published yet."}
            </p>
          ) : null}
          {short.status === "approved" ? (
            <PostReactions
              postId={short.id}
              postKind="short"
              initialCounts={reactionState?.counts ?? emptyReactionCounts()}
              initialUserReaction={reactionState?.userReaction ?? null}
              isAuthenticated={Boolean(user)}
              loginNext={`/shorts/${short.id}`}
              sharePath={`/shorts/${short.id}`}
              shareTitle={short.caption || "A short on Believe The Works"}
              className="pt-1"
            />
          ) : null}
        </div>
      </article>
      <Link href="/shorts" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        More shorts
      </Link>
    </div>
  );
}
