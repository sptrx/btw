"use server";

import { createClient } from "@/utils/supabase/server";

export type JournalNoteItem = {
  id: string;
  title: string;
  body: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listJournalNotes(
  userId: string,
  opts?: { publicOnly?: boolean }
): Promise<JournalNoteItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("journal_note")
    .select("id, title, body, is_public, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (opts?.publicOnly) q = q.eq("is_public", true);
  const { data, error } = await q;
  if (error) {
    console.warn("[listJournalNotes]", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    isPublic: r.is_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function upsertJournalNote(input: {
  id?: string;
  title: string;
  body: string;
  isPublic?: boolean;
}): Promise<{ success: true; note: JournalNoteItem } | { error: string; needsAuth?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save a note.", needsAuth: true };

  const title = input.title.trim().slice(0, 200);
  const body = input.body.trim().slice(0, 20000);
  if (!title || !body) return { error: "Add a title and some notes." };

  const payload = {
    title,
    body,
    is_public: Boolean(input.isPublic),
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("journal_note")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select("id, title, body, is_public, created_at, updated_at")
      .single();
    if (error || !data) return { error: error?.message ?? "Could not update note." };
    return {
      success: true,
      note: {
        id: data.id,
        title: data.title,
        body: data.body,
        isPublic: data.is_public,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  }

  const { data, error } = await supabase
    .from("journal_note")
    .insert({ ...payload, user_id: user.id })
    .select("id, title, body, is_public, created_at, updated_at")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not save note." };
  return {
    success: true,
    note: {
      id: data.id,
      title: data.title,
      body: data.body,
      isPublic: data.is_public,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

export async function deleteJournalNote(
  id: string
): Promise<{ success: true } | { error: string; needsAuth?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in.", needsAuth: true };
  const { error } = await supabase
    .from("journal_note")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}
