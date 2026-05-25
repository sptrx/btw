import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getContentById,
  getChannelBySlug,
  getComments,
  getFeedbackCounts,
  getShareCount,
  getUserHasFeedback,
  isChannelAuthor,
} from "@/actions/channels";
import DeleteContentButton from "./delete-content-button";
import { getCurrentUser, hasAcceptedContentDisclaimer } from "@/actions";
import { isContentKept } from "@/actions/library";
import ContentActions from "./content-actions";
import { ReportContentButton } from "@/components/report-content-button";
import { PENDING_REVIEW_MESSAGE } from "@/lib/moderation-messages";
import { Button } from "@/components/ui/button";
import CommentForm from "./comment-form";
import CommentList from "./comment-list";
import { ChannelContentMedia } from "@/components/channel-content-media";
import { RelativeDate } from "@/components/relative-date";

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

  const [comments, feedbackCounts, shareCount, hasLiked, hasHelpful, hasKept, isAuthor, hasAlreadyAcceptedDisclaimer] = await Promise.all([
    getComments(contentId),
    getFeedbackCounts(contentId),
    getShareCount(contentId),
    user ? getUserHasFeedback(contentId, "like") : false,
    user ? getUserHasFeedback(contentId, "helpful") : false,
    user ? isContentKept(contentId, user.id) : false,
    user ? isChannelAuthor(content.topic_id) : false,
    user ? hasAcceptedContentDisclaimer(user.id) : false,
  ]);

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

  return (
    <div>
      <Link
        href={`/channel/${channelSlug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <span aria-hidden>←</span> Back to {channel.title}
      </Link>

      {moderationStatus === "pending_review" && isAuthor ? (
        <p
          className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          {PENDING_REVIEW_MESSAGE}
        </p>
      ) : null}

      <div className="btw-content-panel mb-6">
        <h1 className="btw-page-title">{content.title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          by {(content.profiles as { display_name?: string })?.display_name ?? "Anonymous"}
          {content.created_at ? (
            <>
              {" · "}
              <RelativeDate date={content.created_at} />
            </>
          ) : null}
        </p>

        {content.body && (
          <div className="mt-4 max-w-none">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90 sm:text-base">
              {content.body}
            </p>
          </div>
        )}

        <ChannelContentMedia items={mediaUrls} />

        <ContentActions
          contentId={contentId}
          channelSlug={channelSlug}
          contentTitle={content.title}
          likes={feedbackCounts.likes}
          helpful={feedbackCounts.helpful}
          shareCount={shareCount}
          hasLiked={hasLiked}
          hasHelpful={hasHelpful}
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
            Sign up to comment, keep posts, give feedback, or repost to your feed.
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

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Comments</h2>
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
