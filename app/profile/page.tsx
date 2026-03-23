import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, getCurrentUser } from "@/actions";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your BTW profile",
};

export default async function Profile() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfile(user.id);
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <div className="border rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">
          {profile?.display_name ?? user.email?.split("@")[0] ?? "Anonymous"}
        </h1>
        {profile?.bio && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{profile.bio}</p>
        )}
        <Link
          href="/dashboard/settings"
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          Edit profile
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-3">Your posts</h2>
      <div className="space-y-3">
        {posts?.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="text-sm text-gray-500 mb-1">
              {new Date(post.created_at).toLocaleDateString()}
            </div>
            <div>{post.text}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
  