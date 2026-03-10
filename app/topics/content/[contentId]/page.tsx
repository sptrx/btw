import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getTopicContentById,
  getTopicById,
  getComments,
  getFeedbackCounts,
  getShareCount,
  getUserHasFeedback,
  isTopicMemberApproved,
  isTopicAuthor,
} from "@/actions/topics";
import { getCurrentUser } from "@/actions";
import ContentActions from "./content-actions";
import CommentForm from "./comment-form";
import CommentList from "./comment-list";

type Props = { params: Promise<{ contentId: string }> };

export default async function ContentPage({ params }: Props) {
  const { contentId } = await params;

  const [content, user] = await Promise.all([
    getTopicContentById(contentId),
    getCurrentUser(),
  ]);

  if (!content) notFound();

  const [topic, comments, feedbackCounts, shareCount, isMember, isAuthor, hasLiked, hasHelpful] =
    await Promise.all([
      getTopicById(content.topic_id),
      getComments(contentId),
      getFeedbackCounts(contentId),
      getShareCount(contentId),
      isTopicMemberApproved(content.topic_id),
      isTopicAuthor(content.topic_id),
      user ? getUserHasFeedback(contentId, "like") : Promise.resolve(false),
      user ? getUserHasFeedback(contentId, "helpful") : Promise.resolve(false),
    ]);

  const canInteract = isMember || isAuthor;

  const typeLabels: Record<string, string> = {
    article: "Article",
    tutorial: "Tutorial",
    debate: "Debate",
    image: "Image",
    video: "Video",
  };

  const mediaUrls = (content.media_urls as { url: string; type: string; caption?: string }[]) ?? [];

  return (
    <div>
      <Link
        href={`/topics/${topic?.slug}`}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
      >
        ← Back to {topic?.title}
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
                  <img
                    src={m.url}
                    alt={m.caption ?? ""}
                    className="max-w-full rounded"
                  />
                ) : (
                  <video src={m.url} controls className="max-w-full rounded" />
                )}
                {m.caption && (
                  <p className="text-sm text-gray-500 mt-1">{m.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {user && canInteract && (
          <ContentActions
            contentId={contentId}
            likes={feedbackCounts.likes}
            helpful={feedbackCounts.helpful}
            shareCount={shareCount}
            hasLiked={hasLiked}
            hasHelpful={hasHelpful}
          />
        )}

        {user && !canInteract && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Request to join this topic to comment, give feedback, or share.
          </p>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Comments</h2>
        {user && canInteract && <CommentForm contentId={contentId} />}
        <CommentList comments={comments} />
      </section>
    </div>
  );
}
