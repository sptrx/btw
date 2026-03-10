import { Metadata } from "next";
import { fetchPosts } from "@/actions";
import CreatePostForm from "@/components/create-post-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Feed",
  description: "Share encouragement and faith with the BTW community.",
};

export default async function Feed() {
  const posts = await fetchPosts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Feed</h1>

      <CreatePostForm />

      <div className="mt-6 space-y-3">
        {posts &&
          posts.map((post) => {
            const profiles = post.profiles as { display_name?: string } | null;
            const displayName = profiles?.display_name ?? "Anonymous";
            return (
              <Link
                className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                href={`/posts/${post.id}`}
                key={post.id}
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {displayName}
                </div>
                <div>{post.text}</div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
