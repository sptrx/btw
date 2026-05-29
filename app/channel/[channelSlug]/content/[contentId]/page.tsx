import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getContentById,
  getChannelBySlug,
  getComments,
  getShareCount,
  isChannelAuthor,
} from "@/actions/channels";
import { getPostReactions } from "@/actions/reactions";
import { emptyReactionCounts } from "@/lib/post-reactions";
import DeleteContentButton from "./delete-content-button";
import { getCurrentUser, getProfile, hasAcceptedContentDisclaimer } from "@/actions";
import { isFollowingUser } from "@/actions/follows";
import { FollowUserButton } from "@/components/follow-user-button";
import { profilePath } from "@/lib/profile-url";
import { isContentKept } from "@/actions/library";
import ContentActions from "./content-actions";
import { ReportContentButton } from "@/components/report-content-button";
import { PendingReviewNotice } from "@/components/pending-review-notice";
import { ContentRejectedNotice } from "@/components/content-rejected-notice";
import { ModerationReviewActions } from "@/components/moderation-review-actions";
import { isSiteModerator } from "@/lib/site-roles";
import { Button } from "@/components/ui/button";
import CommentForm from "./comment-form";
import CommentList from "./comment-list";
import { ChannelContentMedia } from "@/components/channel-content-media";
import { RelativeDate } from "@/components/relative-date";
import { SharingTypeBadge } from "@/components/sharing-type-badge";
import { isSharingType } from "@/lib/sharing-types";

type Props = {
  params: Promise<{ channelSlug: string; contentId: string }>;
};

export default async function ChannelContentPage({ params }: Props) {
  const { channelSlug, contentId } = await params;

  const user = await getCurrentUser();
  const [content, channel] = await Promise.all([
    getContentById(contentId, { viewerUserId: user?.id }),
    getChannelBySlug(channelSlug),
  ]);

  if (!content || !channel) notFound();

  const profile = user ? await getProfile(user.id) : null;
  const isModerator = isSiteModerator(profile?.role);

  const authorId = content.author_id as string;
  const authorProfile = content.profiles as {
    display_name?: string;
    username?: string | null;
  } | null;

  const [comments, shareCount, reactionState, hasKept, isAuthor, hasAlreadyAcceptedDisclaimer, viewerFollowsAuthor] =
    await Promise.all([
      getComments(contentId),
      getShareCount(contentId),
      getPostReactions([{ postId: contentId, postKind: "topic_content" }]),
      user ? isContentKept(contentId, user.id) : false,
      user ? isChannelAuthor(content.topic_id) : false,
      user ? hasAcceptedContentDisclaimer(user.id) : false,
      user && authorId && user.id !== authorId
        ? isFollowingUser(user.id, authorId)
        : Promise.resolve(false),
    ]);

  const reactions =
    reactionState.get(`topic_content:${contentId}`) ?? {
      counts: emptyReactionCounts(),
      userReaction: null,
    };

  const rawMedia = content.media_urls;
  let mediaUrls: { url: string; type: string }[] = [];
  if (Array.isArray(rawMedia)) {
    mediaUrls = rawMedia.filter(
      (m): m is { url: string; type: string } =>
        Boolean(m && typeof (m as { url?: string }).url === "string" && String((m as { url: string }).url).trim())
    );
  } else if (typeof rawMedia === "string") {
    try {
      const parsed = JSON.parse(rawMedia) as unknown;
      if (Array.isArray(parsed)) {
        mediaUrls = parsed.filter(
          (m): m is { url: string; type: string } =>
            Boolean(m && typeof (m as { url?: string }).url === "string")
        );
      }
    } catch {
      /* ignore */
    }
  }

  const moderationStatus =
    (content as { moderation_status?: string | null }).moderation_status ?? "approved";
  const moderationNote =
    (content as { moderation_note?: string | null }).moderation_note ?? null;

  const sharingRaw = (content as { sharing_type?: string }).sharing_type;
  const sharingType =
    sharingRaw && isSharingType(sharingRaw)
      ? sharingRaw
      : content.type === "discussion"
        ? "discussion"
        : "testimony";
  const scriptureRef = (content as { scripture_reference?: string | null }).scripture_reference;
  const isQuestion = sharingType === "question";

  return (
    <div>
      <Link
        href={`/channel/${channelSlug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <span aria-hidden>←</span> Back to {channel.title}
      </Link>

      {moderationStatus === "pending_review" && isAuthor ? (
        <PendingReviewNotice className="mb-4" />
      ) : null}

      {moderationStatus === "rejected" && isAuthor ? (
        <ContentRejectedNotice note={moderationNote} className="mb-4" />
      ) : null}

      {moderationStatus === "pending_review" && isModerator ? (
        <div className="mb-4 rounded-xl border border-border bg-muted/25 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Staff review</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This post is waiting in the moderation queue.
              </p>
              <Link
                href="/dashboard/moderation"
                className="mt-2 inline-flex text-sm text-primary hover:underline"
              >
                Back to moderation dashboard
              </Link>
            </div>
            <ModerationReviewActions contentId={contentId} />
          </div>
        </div>
      ) : null}

      <div className="btw-content-panel mb-6">
        <div className="mb-3">
          <SharingTypeBadge sharingType={sharingType} size="md" />
        </div>
        <h1 className="btw-page-title">{content.title}</h1>
        {scriptureRef?.trim() ? (
          <p className="mt-2 text-sm font-medium text-muted-foreground">{scriptureRef.trim()}</p>
        ) : null}
        <p className="mt-1.5 text-sm text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>
            by{" "}
            {authorProfile?.username ? (
              <Link
                href={profilePath({ id: authorId, username: authorProfile.username })}
                className="text-foreground hover:text-primary hover:underline"
              >
                {authorProfile?.display_name ?? "Anonymous"}
              </Link>
            ) : (
              (authorProfile?.display_name ?? "Anonymous")
            )}
          </span>
          {user && authorId && user.id !== authorId && !viewerFollowsAuthor ? (
            <>
              <span aria-hidden>·</span>
              <FollowUserButton
                userId={authorId}
                displayName={authorProfile?.display_name ?? "Anonymous"}
                initialFollowing={viewerFollowsAuthor}
                isAuthenticated={!!user}
                loginNext={`/channel/${channelSlug}/content/${contentId}`}
                variant="link"
              />
            </>
          ) : null}
          {content.created_at ? (
            <>
              <span aria-hidden>·</span>
              <RelativeDate date={content.created_at} />
            </>
          ) : null}
        </p>

        {content.body && (
          <div className="mt-4 max-w-none">
            <p className="whitespace-pre-wrap btw-prose">
              {content.body}
            </p>
          </div>
        )}

        <ChannelContentMedia items={mediaUrls} />

        {isQuestion ? (
          <div className="mt-4">
            <Button className="min-h-11 touch-manipulation" asChild>
              <a href="#comments">Answer this</a>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Your thoughtful response can help someone seeking truth feel welcomed.
            </p>
          </div>
        ) : null}

        <ContentActions
          contentId={contentId}
          channelSlug={channelSlug}
          contentTitle={content.title}
          shareCount={shareCount}
          reactionCounts={reactions.counts}
          userReaction={reactions.userReaction}
          hasKept={hasKept}
          isAuthenticated={!!user}
        />

        <div className="mt-3">
          <ReportContentButton
            contentId={contentId}
            channelSlug={channelSlug}
            isAuthenticated={!!user}
          />
        </div>

        {!user && (
          <p className="mt-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Sign up to comment, keep posts, respond in faith, or share to your feed.
          </p>
        )}

        {isAuthor && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
            <Button variant="secondary" className="touch-manipulation" asChild>
              <Link href={`/channel/${channelSlug}/content/${contentId}/edit`}>Edit content</Link>
            </Button>
            <DeleteContentButton contentId={contentId} />
          </div>
        )}
      </div>

      <section id="comments" className="mt-8 scroll-mt-24">
        <h2 className="btw-section-title mb-3">Comments</h2>
        {user && (
          <CommentForm
            contentId={contentId}
            hasAlreadyAcceptedDisclaimer={hasAlreadyAcceptedDisclaimer}
          />
        )}
        <CommentList comments={comments} />
      </section>
    </div>
  );
}
