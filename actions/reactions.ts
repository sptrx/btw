"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createNotification } from "@/actions/notifications";
import {
  emptyReactionCounts,
  POST_REACTION_TYPES,
  type FeedPostKind,
  type PostReactionType,
  type ReactionCounts,
} from "@/lib/post-reactions";

export type PostReactionKey = { postId: string; postKind: FeedPostKind };

export type PostReactionState = {
  counts: ReactionCounts;
  userReaction: PostReactionType | null;
};

function isMissingPostReactionTable(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (!msg.includes("post_reaction")) return false;
  return (
    code === "42P01" ||
    code.startsWith("PGRST") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

function aggregateRows(
  rows: { reaction_type: string }[] | null | undefined
): ReactionCounts {
  const counts = emptyReactionCounts();
  for (const row of rows ?? []) {
    const t = row.reaction_type as PostReactionType;
    if (POST_REACTION_TYPES.includes(t)) counts[t] += 1;
  }
  return counts;
}

export async function getPostReactions(
  keys: PostReactionKey[]
): Promise<Map<string, PostReactionState>> {
  const out = new Map<string, PostReactionState>();
  if (keys.length === 0) return out;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const postIds = [...new Set(keys.map((k) => k.postId))];
  const { data, error } = await supabase
    .from("post_reaction")
    .select("post_id, post_kind, reaction_type, user_id")
    .in("post_id", postIds);

  if (error) {
    if (isMissingPostReactionTable(error)) {
      for (const k of keys) {
        out.set(`${k.postKind}:${k.postId}`, {
          counts: emptyReactionCounts(),
          userReaction: null,
        });
      }
      return out;
    }
    console.warn("[reactions] getPostReactions:", error.message);
    return out;
  }

  const keySet = new Set(keys.map((k) => `${k.postKind}:${k.postId}`));

  for (const key of keySet) {
    const [postKind, postId] = key.split(":") as [FeedPostKind, string];
    const matching = (data ?? []).filter(
      (r) => r.post_id === postId && r.post_kind === postKind
    );
    const counts = aggregateRows(matching.map((r) => ({ reaction_type: r.reaction_type })));
    const userRow = user
      ? matching.find((r) => r.user_id === user.id)
      : undefined;
    out.set(key, {
      counts,
      userReaction: userRow ? (userRow.reaction_type as PostReactionType) : null,
    });
  }

  return out;
}

export async function setPostReaction(
  postId: string,
  postKind: FeedPostKind,
  reactionType: PostReactionType
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to respond." };

  const { data: existing } = await supabase
    .from("post_reaction")
    .select("id, reaction_type")
    .eq("post_id", postId)
    .eq("post_kind", postKind)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("post_reaction").upsert(
    {
      post_id: postId,
      post_kind: postKind,
      user_id: user.id,
      reaction_type: reactionType,
    },
    { onConflict: "post_id,post_kind,user_id" }
  );

  if (error) {
    if (isMissingPostReactionTable(error)) {
      return { error: "Reactions are not available yet. Please try again later." };
    }
    return { error: error.message };
  }

  if (
    postKind === "topic_content" &&
    !existing &&
    (reactionType === "amen" || reactionType === "blessed" || reactionType === "praise_god")
  ) {
    const { data: content } = await supabase
      .from("topic_content")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle();
    if (content?.author_id && content.author_id !== user.id) {
      await createNotification({
        recipientId: content.author_id,
        actorId: user.id,
        type: "like",
        topicContentId: postId,
      });
    }
  }

  revalidateFeedPaths(postKind, postId);
  return { success: true };
}

export async function clearPostReaction(
  postId: string,
  postKind: FeedPostKind
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in." };

  const { error } = await supabase
    .from("post_reaction")
    .delete()
    .eq("post_id", postId)
    .eq("post_kind", postKind)
    .eq("user_id", user.id);

  if (error && !isMissingPostReactionTable(error)) {
    return { error: error.message };
  }

  revalidateFeedPaths(postKind, postId);
  return { success: true };
}

function revalidateFeedPaths(postKind: FeedPostKind, postId: string) {
  revalidatePath("/feed");
  revalidatePath("/");
  if (postKind === "topic_content") {
    revalidatePath("/channel", "layout");
  }
  if (postKind === "prayer_request" || postKind === "praise_report") {
    revalidatePath("/prayer");
    revalidatePath(`/prayer/${postId}`);
  }
}
