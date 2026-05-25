import { notFound } from "next/navigation";
import { getProfile, getCurrentUser } from "@/actions";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ProfileHeader } from "@/components/profile-header";
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
      <ProfileHeader profile={profile} showEditLink={isOwnProfile} />

      <h2 className="mb-3 mt-8 btw-section-title">Posts</h2>
      <div className="space-y-3">
        {!posts || posts.length === 0 ? (
          <div className="btw-empty">No posts yet.</div>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="btw-app-row">
              <RelativeDate
                date={post.created_at}
                className="mb-1 block text-sm text-muted-foreground"
              />
              <div className="whitespace-pre-wrap text-foreground">{post.text}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
