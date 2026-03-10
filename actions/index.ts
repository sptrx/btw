"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { moderateContent, checkFakeUserHeuristic } from "@/lib/moderation";

export async function moderate(text: string) {
  const supabase = createClient();

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
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      text,
      likes,
      reposts,
      created_at,
      user_id,
      profiles:user_id (display_name, avatar_url)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export async function getPost(postId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      text,
      likes,
      reposts,
      created_at,
      user_id,
      profiles:user_id (display_name, avatar_url)
    `)
    .eq("id", postId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function deletePost(postId: string) {
  const supabase = createClient();

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
  const supabase = createClient();

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data;
}

export async function updateProfile(formData: FormData) {
  const supabase = createClient();

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
