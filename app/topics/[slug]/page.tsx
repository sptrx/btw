import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getTopicBySlug,
  getTopicContent,
  isTopicAuthor,
  getMyTopicMembership,
} from "@/actions/topics";
import { getCurrentUser } from "@/actions";
import JoinTopicButton from "./join-topic-button";
import AddContentLink from "./add-content-link";

type Props = { params: Promise<{ slug: string }> };

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const [topic, user] = await Promise.all([getTopicBySlug(slug), getCurrentUser()]);

  if (!topic) notFound();

  const [content, isAuthor, membership] = await Promise.all([
    getTopicContent(topic.id),
    isTopicAuthor(topic.id),
    getMyTopicMembership(topic.id),
  ]);

  const author = topic.profiles as { display_name?: string; avatar_url?: string } | null;

  return (
    <div>
      <div className="border rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">{topic.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          by {author?.display_name ?? "Anonymous"}
        </p>
        {topic.description && (
          <p className="mt-3 text-gray-600 dark:text-gray-400">{topic.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {user && !isAuthor && (
            <JoinTopicButton
              topicId={topic.id}
              membership={membership}
            />
          )}
          {isAuthor && (
            <>
              <AddContentLink topicId={topic.id} slug={topic.slug} />
              <Link
                href={`/dashboard/topics/${topic.id}`}
                className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Manage members
              </Link>
            </>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Content</h2>
      <div className="space-y-3">
        {content.length === 0 && (
          <p className="text-gray-500 py-8 text-center">No content yet.</p>
        )}
        {content.map((item) => {
          const typeLabels: Record<string, string> = {
            article: "Article",
            tutorial: "Tutorial",
            debate: "Debate",
            image: "Image",
            video: "Video",
          };
          return (
            <Link
              key={item.id}
              href={`/topics/content/${item.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                {typeLabels[item.type] ?? item.type}
              </span>
              <h3 className="font-medium mt-2">{item.title}</h3>
              {item.body && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {item.body}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
