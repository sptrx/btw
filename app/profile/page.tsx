import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, getCurrentUser } from "@/actions";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { RelativeDate } from "@/components/relative-date";

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
      <p className="btw-section-eyebrow">Account</p>
      <div className="btw-content-panel mb-8">
        <h1 className="btw-page-title text-xl sm:text-2xl">
          {profile?.display_name ?? user.email?.split("@")[0] ?? "Anonymous"}
        </h1>
        {profile?.bio && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>}
        <Link
          href="/dashboard/settings"
          className="mt-5 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Edit profile
        </Link>
      </div>

      <h2 className="mb-4 text-lg font-semibold tracking-tight">Your posts</h2>
      <div className="space-y-3">
        {posts?.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="btw-app-row">
            <RelativeDate date={post.created_at} className="mb-1 block text-xs text-muted-foreground" />
            <div className="text-sm">{post.text}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
