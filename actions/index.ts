"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { moderateContent, checkFakeUserHeuristic } from "@/lib/moderation";

export async function moderate(text: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to post." };
  }

  if (!text?.trim()) {
    return { error: "Text is required!" };
  }

  try {
    // Fake user / spam heuristic: limit posts per day
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (checkFakeUserHeuristic(user.id, count ?? 0)) {
      return {
        flagged: true,
        msg: "Posting limit reached. Please try again later.",
      };
    }

    const result = await moderateContent(text);
    if (!result.allowed) {
      return {
        flagged: true,
        msg: result.reason ?? "Your post contains inappropriate content.",
      };
    }

    await supabase.from("posts").insert({
      text: text.trim(),
      user_id: user.id,
    });
    revalidatePath("/feed");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchPosts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, text, likes, reposts, created_at, user_id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  const posts = data ?? [];
  const withProfiles = await Promise.all(
    posts.map(async (p) => {
      const profile = await getProfile(p.user_id);
      return {
        ...p,
        profiles: profile ? { display_name: profile.display_name, avatar_url: profile.avatar_url } : null,
      };
    })
  );
  return withProfiles;
}

export async function getPost(postId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, text, likes, reposts, created_at, user_id")
    .eq("id", postId)
    .single();

  if (error || !data) return null;
  const profile = await getProfile(data.user_id);
  return {
    ...data,
    profiles: profile ? { display_name: profile.display_name, avatar_url: profile.avatar_url } : null,
  };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
  if (!post || post.user_id !== user.id) {
    redirect("/feed");
  }

  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath("/feed");
  redirect("/feed");
}

export async function updatePost(
  postId: string,
  newPostText: string
): Promise<{ error?: string } | void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
  if (!post || post.user_id !== user.id) {
    redirect("/feed");
  }

  const result = await moderateContent(newPostText);
  if (!result.allowed) {
    return { error: result.reason ?? "Content not allowed." };
  }

  await supabase
    .from("posts")
    .update({ text: newPostText.trim(), updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", user.id);

  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}

export async function navigateToEditPage(postId: string) {
  redirect(`/posts/${postId}/edit`);
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data;
}

/**
 * True when the disclaimer-acceptance column is missing entirely. Lets us
 * gracefully fall back to the legacy "ask on every submission" behavior in
 * environments where the migration hasn't been applied yet (same approach as
 * `isMissingTopicsBannerImageUrlColumn` in actions/channels.ts).
 */
function isMissingDisclaimerColumn(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (!msg.includes("content_disclaimer_accepted_at")) return false;
  if (code === "42703" || code.startsWith("PGRST")) return true;
  return (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find")
  );
}

/**
 * Whether `userId` has previously agreed to the content submission disclaimer.
 * Used to skip the per-submission checkbox after the first acceptance.
 *
 * Returns false (= prompt the user) if the migration column doesn't exist yet,
 * or on any other unexpected error -- the disclaimer prompt is the safe default.
 */
export async function hasAcceptedContentDisclaimer(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("content_disclaimer_accepted_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    if (!isMissingDisclaimerColumn(error)) {
      console.warn("[hasAcceptedContentDisclaimer]", error.message);
    }
    return false;
  }
  const ts = (data as { content_disclaimer_accepted_at?: string | null } | null)
    ?.content_disclaimer_accepted_at;
  return Boolean(ts);
}

/**
 * Stamp the user's first acceptance of the content disclaimer. No-op if the
 * column is missing (pre-migration) or if a timestamp is already recorded --
 * we only want the *first* acceptance for audit purposes.
 */
export async function recordContentDisclaimerAcceptance(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ content_disclaimer_accepted_at: new Date().toISOString() })
    .eq("id", userId)
    .is("content_disclaimer_accepted_at", null);
  if (error && !isMissingDisclaimerColumn(error)) {
    console.warn("[recordContentDisclaimerAcceptance]", error.message);
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const displayName = formData.get("display_name") as string | null;
  const bio = formData.get("bio") as string | null;

  await supabase
    .from("profiles")
    .update({
      display_name: displayName?.trim() || null,
      bio: bio?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard/settings");
  redirect("/profile");
}
