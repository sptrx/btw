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

import { normalizeOptionalText, normalizeWebsiteUrl } from "@/lib/profile-fields";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  ministry_name: string | null;
  website_url: string | null;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
  content_disclaimer_accepted_at?: string | null;
};

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, bio, city, ministry_name, website_url, role, created_at, updated_at, content_disclaimer_accepted_at"
    )
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as ProfileRow;
}

/** Upgrade a regular user so they can create and manage channels. */
export async function promoteToChannelAuthor(
  userId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "channel_author", updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileError) {
    console.error("[promoteToChannelAuthor]", profileError.message);
    return { error: "Could not enable channel creation. Please try again." };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { role: "channel_author" },
  });
  if (authError) {
    console.warn("[promoteToChannelAuthor] auth metadata:", authError.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/channel");
  revalidatePath("/channel/new");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function setAccountRole(
  role: "user" | "channel_author"
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    console.error("[setAccountRole]", profileError.message);
    return { error: "Could not save your choice. Please try again." };
  }

  const { error: authError } = await supabase.auth.updateUser({ data: { role } });
  if (authError) {
    console.warn("[setAccountRole] auth metadata:", authError.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/channel");
  return { success: true };
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

export async function updateProfile(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const displayName = normalizeOptionalText(formData.get("display_name"), 80);
  const bio = normalizeOptionalText(formData.get("bio"), 500);
  const city = normalizeOptionalText(formData.get("city"), 80);
  const ministryName = normalizeOptionalText(formData.get("ministry_name"), 120);
  const avatarRaw = normalizeOptionalText(formData.get("avatar_url"), 2048);

  const websiteRaw = (formData.get("website_url") as string | null)?.trim() ?? "";
  let websiteUrl: string | null = null;
  if (websiteRaw) {
    websiteUrl = normalizeWebsiteUrl(websiteRaw);
    if (!websiteUrl) {
      return { error: "Enter a valid website or social link (e.g. example.com or https://…)." };
    }
  }

  if (avatarRaw && !/^https?:\/\//i.test(avatarRaw)) {
    return { error: "Avatar URL must start with http:// or https://." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio,
      city,
      ministry_name: ministryName,
      website_url: websiteUrl,
      avatar_url: avatarRaw,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile]", error.message);
    return { error: "Could not save profile. If this persists, run the latest database migrations." };
  }

  revalidatePath("/profile");
  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  redirect("/profile");
}
