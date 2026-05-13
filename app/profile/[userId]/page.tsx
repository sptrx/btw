import { notFound } from "next/navigation";
import { getProfile, getCurrentUser } from "@/actions";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { RelativeDate } from "@/components/relative-date";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function UserProfile({ params }: Props) {
  const { userId } = await params;
  const [profile, currentUser] = await Promise.all([
    getProfile(userId),
    getCurrentUser(),
  ]);

  const supabase = await createClient();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div>
      <div className="border rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">
          {profile.display_name ?? "Anonymous"}
        </h1>
        {profile.bio && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{profile.bio}</p>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-3">Posts</h2>
      <div className="space-y-3">
        {posts?.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RelativeDate date={post.created_at} className="mb-1 block text-sm text-gray-500" />
            <div>{post.text}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
