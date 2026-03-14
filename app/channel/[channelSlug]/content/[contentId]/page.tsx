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
import { getCurrentUser } from "@/actions";
import ContentActions from "./content-actions";
import CommentForm from "./comment-form";
import CommentList from "./comment-list";

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

  const [comments, feedbackCounts, shareCount, hasLiked, hasHelpful, isAuthor] = await Promise.all([
    getComments(contentId),
    getFeedbackCounts(contentId),
    getShareCount(contentId),
    user ? getUserHasFeedback(contentId, "like") : false,
    user ? getUserHasFeedback(contentId, "helpful") : false,
    user ? isChannelAuthor(content.topic_id) : false,
  ]);

  const typeLabels: Record<string, string> = {
    video: "Video",
    podcast: "Podcast",
    article: "Article",
    discussion: "Discussion",
  };

  const mediaUrls = (content.media_urls as { url: string; type: string }[]) ?? [];

  return (
    <div>
      <Link
        href={`/channel/${channelSlug}`}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
      >
        ← Back to {channel.title}
      </Link>

      <div className="border rounded-lg p-6 mb-6">
        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
          {typeLabels[content.type] ?? content.type}
        </span>
        <h1 className="text-2xl font-bold mt-2">{content.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          by {(content.profiles as { display_name?: string })?.display_name ?? "Anonymous"}
        </p>

        {content.body && (
          <div className="mt-4 prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{content.body}</p>
          </div>
        )}

        {mediaUrls.length > 0 && (
          <div className="mt-4 space-y-4">
            {mediaUrls.map((m, i) => (
              <div key={i}>
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="max-w-full rounded" />
                ) : (
                  <video src={m.url} controls className="max-w-full rounded" />
                )}
              </div>
            ))}
          </div>
        )}

        {user && (
          <ContentActions
            contentId={contentId}
            channelSlug={channelSlug}
            likes={feedbackCounts.likes}
            helpful={feedbackCounts.helpful}
            shareCount={shareCount}
            hasLiked={hasLiked}
            hasHelpful={hasHelpful}
          />
        )}

        {!user && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Sign up to comment, give feedback, or share.
          </p>
        )}

        {isAuthor && (
          <div className="mt-4 pt-4 border-t">
            <DeleteContentButton contentId={contentId} />
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Comments</h2>
        {user && <CommentForm contentId={contentId} />}
        <CommentList comments={comments} />
      </section>
    </div>
  );
}
