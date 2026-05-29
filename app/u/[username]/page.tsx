import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/actions";
import {
  getProfileByUsername,
  getFollowCounts,
  getFollowStateForViewer,
  getFollowersList,
  getFollowingList,
} from "@/actions/follows";
import { createClient } from "@/utils/supabase/server";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileTabs, type ProfileTab } from "@/components/profile-tabs";
import { RelativeDate } from "@/components/relative-date";
import { UserAvatar } from "@/components/user-avatar";
import { profilePath } from "@/lib/profile-url";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function parseTab(raw: string | undefined): ProfileTab {
  if (raw === "channels" || raw === "following" || raw === "followers") return raw;
  return "posts";
}

export default async function UserProfileByUsername({ params, searchParams }: Props) {
  const { username } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = parseTab(tabParam);

  const [profile, currentUser] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const isOwnProfile = currentUser?.id === profile.id;
  const [counts, followState] = await Promise.all([
    getFollowCounts(profile.id),
    getFollowStateForViewer(profile.id, currentUser?.id ?? null),
  ]);

  const basePath = profilePath(profile);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ProfileHeader
        profile={profile}
        showEditLink={isOwnProfile}
        followerCount={counts.followers}
        followingCount={counts.following}
        showFollowButton={followState.canFollow}
        initialFollowing={followState.isFollowing}
        isAuthenticated={!!currentUser}
        isOwnProfile={isOwnProfile}
      />

      <div className="mt-8">
        <Suspense fallback={null}>
          <ProfileTabs basePath={basePath} />
        </Suspense>

        <div className="mt-6">
          {tab === "posts" ? (
            <ProfilePosts userId={profile.id} />
          ) : tab === "channels" ? (
            <ProfileChannels userId={profile.id} />
          ) : tab === "following" ? (
            <ProfileUserList userId={profile.id} kind="following" />
          ) : (
            <ProfileUserList userId={profile.id} kind="followers" />
          )}
        </div>
      </div>
    </div>
  );
}

async function ProfilePosts({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: content } = await supabase
    .from("topic_content")
    .select("id, title, created_at, topics(slug, title)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  const hasPosts = (posts?.length ?? 0) > 0;
  const hasContent = (content?.length ?? 0) > 0;

  if (!hasPosts && !hasContent) {
    return <div className="btw-empty">No posts yet.</div>;
  }

  return (
    <div className="space-y-3">
      {(content ?? []).map((row) => {
        const topic = Array.isArray(row.topics) ? row.topics[0] : row.topics;
        const slug = topic?.slug;
        const href = slug ? `/channel/${slug}/content/${row.id}` : "#";
        return (
          <Link key={row.id} href={href} className="btw-app-row block">
            <p className="text-xs text-muted-foreground mb-1">
              {topic?.title ? `${topic.title} · ` : ""}
              <RelativeDate date={row.created_at} />
            </p>
            <div className="font-medium text-foreground">{row.title}</div>
          </Link>
        );
      })}
      {(posts ?? []).map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`} className="btw-app-row block">
          <RelativeDate
            date={post.created_at}
            className="mb-1 block text-sm text-muted-foreground"
          />
          <div className="whitespace-pre-wrap text-foreground">{post.text}</div>
        </Link>
      ))}
    </div>
  );
}

async function ProfileChannels({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, title, slug, description, created_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });
  const channels = data ?? [];

  if (!channels.length) {
    return <div className="btw-empty">No channels yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {channels.map((ch) => (
        <li key={ch.id}>
          <Link href={`/channel/${ch.slug}`} className="btw-app-row block">
            <h3 className="font-medium text-foreground">{ch.title}</h3>
            {ch.description ? (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ch.description}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function ProfileUserList({
  userId,
  kind,
}: {
  userId: string;
  kind: "followers" | "following";
}) {
  const list =
    kind === "followers" ? await getFollowersList(userId) : await getFollowingList(userId);

  if (!list.length) {
    return (
      <div className="btw-empty">
        {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {list.map((person) => (
        <li key={person.id}>
          <Link
            href={profilePath(person)}
            className="btw-app-row flex items-center gap-3"
          >
            <UserAvatar
              name={person.displayName}
              avatarUrl={person.avatarUrl}
              size="md"
            />
            <div className="min-w-0">
              <p className="font-medium text-foreground">{person.displayName}</p>
              <p className="text-sm text-muted-foreground">@{person.username}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
