import { Metadata } from "next";
import Link from "next/link";
import { fetchTopics } from "@/actions/topics";
import { getCurrentUser } from "@/actions";

export const metadata: Metadata = {
  title: "Topics",
  description: "Browse faith-based topic channels",
};

export default async function TopicsPage() {
  const [topics, user] = await Promise.all([fetchTopics(), getCurrentUser()]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Topics</h1>
        {user && (
          <Link
            href="/topics/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create topic
          </Link>
        )}
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Explore channels by authors. Request to join to comment, give feedback, and share.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((topic) => {
          const author = topic.profiles as { display_name?: string } | null;
          return (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <h2 className="font-semibold text-lg">{topic.title}</h2>
              {topic.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {topic.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">by {author?.display_name ?? "Anonymous"}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
