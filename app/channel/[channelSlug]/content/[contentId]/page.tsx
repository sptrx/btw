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
import ContentActions from "./content-actions";
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

  const [content, channel, user] = await Promise.all([
    getContentById(contentId),
    getChannelBySlug(channelSlug),
    getCurrentUser(),
  ]);

  if (!content || !channel) notFound();

  const [comments, feedbackCounts, shareCount, hasLiked, hasHelpful, isAuthor, hasAlreadyAcceptedDisclaimer] = await Promise.all([
    getComments(contentId),
    getFeedbackCounts(contentId),
    getShareCount(contentId),
    user ? getUserHasFeedback(contentId, "like") : false,
    user ? getUserHasFeedback(contentId, "helpful") : false,
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

  return (
    <div>
      <Link
        href={`/channel/${channelSlug}`}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
      >
        ← Back to {channel.title}
      </Link>

      <div className="border rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          by {(content.profiles as { display_name?: string })?.display_name ?? "Anonymous"}
          {content.created_at ? (
            <>
              {" · "}
              <RelativeDate date={content.created_at} />
            </>
          ) : null}
        </p>

        {content.body && (
          <div className="mt-4 prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{content.body}</p>
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
          isAuthenticated={!!user}
        />

        {!user && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Sign up to comment, give feedback, or repost to your feed.
          </p>
        )}

        {isAuthor && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-3">
            <Button variant="secondary" className="touch-manipulation" asChild>
              <Link href={`/channel/${channelSlug}/content/${contentId}/edit`}>Edit content</Link>
            </Button>
            <DeleteContentButton contentId={contentId} />
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Comments</h2>
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
