"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createFollowNotification } from "@/actions/notifications";
import { profilePath } from "@/lib/profile-url";
import type { ProfilePublicFields } from "@/lib/profile-fields";

export type FollowCounts = {
  followers: number;
  following: number;
};

export type FollowListItem = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

export type PeopleYouMayKnowItem = FollowListItem & {
  sharedChannelCount: number;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const supabase = await createClient();
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from("user_follow")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("user_follow")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);
  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

export async function isFollowingUser(
  followerId: string | null,
  followingId: string
): Promise<boolean> {
  if (!followerId || followerId === followingId) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_follow")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}

export async function getFollowedUserIds(viewerId: string | null): Promise<Set<string>> {
  if (!viewerId) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_follow")
    .select("following_id")
    .eq("follower_id", viewerId);
  return new Set((data ?? []).map((r) => r.following_id));
}

export async function followUser(
  followingId: string
): Promise<{ success: true } | { error: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (user.id === followingId) return { error: "You cannot follow yourself." };

  const { error } = await supabase.from("user_follow").insert({
    follower_id: user.id,
    following_id: followingId,
  });

  if (error) {
    const code = String(error.code ?? "");
    if (code === "23505") return { success: true };
    if (error.message.includes("user_follow")) {
      return { error: "Follow is not available yet. Run the latest database migrations." };
    }
    return { error: error.message };
  }

  await createFollowNotification({ recipientId: followingId, actorId: user.id });

  const { data: target } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", followingId)
    .maybeSingle();

  revalidatePath("/feed");
  if (target?.username) revalidatePath(`/u/${target.username}`);
  revalidatePath(profilePath({ id: followingId, username: target?.username }));
  return { success: true };
}

export async function unfollowUser(
  followingId: string
): Promise<{ success: true } | { error: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("user_follow")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) {
    if (error.message.includes("user_follow")) return { success: true };
    return { error: error.message };
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", followingId)
    .maybeSingle();

  revalidatePath("/feed");
  if (target?.username) revalidatePath(`/u/${target.username}`);
  return { success: true };
}

function mapProfileRow(p: {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}): FollowListItem {
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name?.trim() || "Anonymous",
    avatarUrl: p.avatar_url,
    bio: p.bio,
  };
}

export async function getFollowersList(userId: string, limit = 50): Promise<FollowListItem[]> {
  const supabase = await createClient();
  const { data: edges } = await supabase
    .from("user_follow")
    .select("follower_id")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const ids = (edges ?? []).map((e) => e.follower_id);
  if (!ids.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .in("id", ids);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(mapProfileRow);
}

export async function getFollowingList(userId: string, limit = 50): Promise<FollowListItem[]> {
  const supabase = await createClient();
  const { data: edges } = await supabase
    .from("user_follow")
    .select("following_id")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const ids = (edges ?? []).map((e) => e.following_id);
  if (!ids.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .in("id", ids);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(mapProfileRow);
}

/** Users who walk with the same channels as the viewer (not already followed). */
export async function getPeopleYouMayKnow(limit = 5): Promise<PeopleYouMayKnowItem[]> {
  const { supabase, user } = await requireUser();
  if (!user) return [];

  const { data: myTopics } = await supabase
    .from("topic_members")
    .select("topic_id")
    .eq("user_id", user.id)
    .eq("status", "approved");

  const topicIds = (myTopics ?? []).map((r) => r.topic_id);
  if (!topicIds.length) return [];

  const { data: coMembers } = await supabase
    .from("topic_members")
    .select("user_id, topic_id")
    .in("topic_id", topicIds)
    .eq("status", "approved")
    .neq("user_id", user.id)
    .limit(200);

  const followed = await getFollowedUserIds(user.id);
  const sharedCount = new Map<string, number>();
  for (const row of coMembers ?? []) {
    if (followed.has(row.user_id)) continue;
    sharedCount.set(row.user_id, (sharedCount.get(row.user_id) ?? 0) + 1);
  }

  const ranked = [...sharedCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (!ranked.length) return [];

  const ids = ranked.map(([id]) => id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .in("id", ids);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ranked
    .map(([id, count]) => {
      const p = byId.get(id);
      if (!p?.username) return null;
      return { ...mapProfileRow(p), sharedChannelCount: count };
    })
    .filter((x): x is PeopleYouMayKnowItem => Boolean(x));
}

export async function getProfileByUsername(
  username: string
): Promise<(ProfilePublicFields & { username: string; created_at: string; profile_private: boolean }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, city, ministry_name, website_url, role, created_at, profile_private"
    )
    .ilike("username", username.trim())
    .maybeSingle();

  if (error || !data?.username) return null;
  return data as ProfilePublicFields & {
    username: string;
    created_at: string;
    profile_private: boolean;
  };
}

export async function getFollowStateForViewer(
  profileUserId: string,
  viewerId: string | null
): Promise<{ isFollowing: boolean; canFollow: boolean }> {
  if (!viewerId || viewerId === profileUserId) {
    return { isFollowing: false, canFollow: false };
  }
  const isFollowing = await isFollowingUser(viewerId, profileUserId);
  return { isFollowing, canFollow: true };
}
