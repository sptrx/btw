"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getProfile } from "@/actions";
import { moderateContent } from "@/lib/moderation";
import { isSiteModerator } from "@/lib/site-roles";
import { SHORT_CAPTION_MAX } from "@/lib/stream-limits";
import {
  createDirectUpload,
  deleteStreamVideo,
  isStreamConfigured,
} from "@/lib/stream";
import { syncShortFromStream } from "@/lib/shorts-sync";
import type { ShortItem, ShortStatus } from "@/lib/shorts-types";

const DAILY_UPLOAD_LIMIT = 5;

type Row = {
  id: string;
  author_id: string;
  caption: string;
  stream_uid: string | null;
  status: ShortStatus;
  duration_seconds: number | null;
  created_at: string;
  rejection_reason: string | null;
};

const COLUMNS =
  "id, author_id, caption, stream_uid, status, duration_seconds, created_at, rejection_reason";

/** Moves rows still waiting on Stream forward, so a missed webhook never leaves a short stuck. */
async function syncStuck(rows: Row[]): Promise<boolean> {
  const stuck = rows.filter((r) => r.stream_uid && ["uploading", "processing"].includes(r.status));
  if (!stuck.length) return false;
  const results = await Promise.all(stuck.map((r) => syncShortFromStream(r.stream_uid as string)));
  return results.some((st, i) => st && st !== stuck[i].status);
}

async function withAuthors(rows: Row[]): Promise<ShortItem[]> {
  if (!rows.length) return [];
  const supabase = await createClient();
  const ids = [...new Set(rows.map((r) => r.author_id))];
  const { data } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
  const byId = new Map((data ?? []).map((p) => [p.id as string, p]));
  return rows.map((r) => {
    const p = byId.get(r.author_id) as { display_name?: string | null; username?: string | null } | undefined;
    return {
      id: r.id,
      caption: r.caption,
      streamUid: r.stream_uid,
      status: r.status,
      durationSeconds: r.duration_seconds,
      createdAt: r.created_at,
      authorId: r.author_id,
      authorName: p?.display_name?.trim() || p?.username || "A member",
      authorUsername: p?.username ?? null,
      rejectionReason: r.rejection_reason,
    };
  });
}

export async function startShortUpload(
  captionRaw: string,
): Promise<{ id: string; uploadURL: string } | { error: string }> {
  if (!isStreamConfigured()) return { error: "Video uploads aren't available yet." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to share a short." };

  const caption = (captionRaw ?? "").trim();
  if (caption.length > SHORT_CAPTION_MAX) {
    return { error: `Keep the caption under ${SHORT_CAPTION_MAX} characters.` };
  }
  if (caption) {
    const verdict = await moderateContent(caption, { contentType: "video" });
    if (!verdict.allowed) {
      return { error: verdict.reason || "That caption can't be posted. Try rewording it." };
    }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("shorts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_UPLOAD_LIMIT) {
    return { error: `You can share up to ${DAILY_UPLOAD_LIMIT} shorts a day. Try again tomorrow.` };
  }

  let upload: { uploadURL: string; uid: string };
  try {
    upload = await createDirectUpload(user.id);
  } catch {
    return { error: "Couldn't start the upload. Try again in a moment." };
  }

  const { data, error } = await supabase
    .from("shorts")
    .insert({ author_id: user.id, caption, stream_uid: upload.uid, status: "uploading" })
    .select("id")
    .single();
  if (error || !data) return { error: "Couldn't save your short. Try again." };

  return { id: data.id as string, uploadURL: upload.uploadURL };
}

export async function finishShortUpload(id: string): Promise<{ status: ShortStatus } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };
  const { data: row } = await supabase
    .from("shorts")
    .select("stream_uid")
    .eq("id", id)
    .eq("author_id", user.id)
    .maybeSingle();
  if (!row?.stream_uid) return { error: "Short not found." };
  const status = await syncShortFromStream(row.stream_uid as string);
  revalidatePath("/shorts/mine");
  return status ? { status } : { error: "Couldn't check the upload yet." };
}

export async function listApprovedShorts(
  cursor?: string | null,
  limit = 10,
): Promise<{ items: ShortItem[]; nextCursor: string | null }> {
  const supabase = await createClient();
  let q = supabase
    .from("shorts")
    .select(COLUMNS)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (cursor) q = q.lt("created_at", cursor);
  const { data } = await q;
  const rows = (data ?? []) as Row[];
  const page = rows.slice(0, limit);
  const items = await withAuthors(page);
  return { items, nextCursor: rows.length > limit ? page[page.length - 1].created_at : null };
}

export async function getShort(id: string): Promise<ShortItem | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("shorts").select(COLUMNS).eq("id", id).maybeSingle();
  if (!data) return null;
  return (await withAuthors([data as Row]))[0] ?? null;
}

export async function listMyShorts(): Promise<ShortItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("shorts")
    .select(COLUMNS)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  let rows = (data ?? []) as Row[];
  if (await syncStuck(rows)) {
    const again = await supabase
      .from("shorts")
      .select(COLUMNS)
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    rows = (again.data ?? []) as Row[];
  }
  return withAuthors(rows);
}

async function requireModerator(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };
  const profile = await getProfile(user.id);
  if (!isSiteModerator(profile?.role)) return { error: "Moderator access required." };
  return { userId: user.id };
}

export async function listPendingShorts(): Promise<ShortItem[] | { error: string }> {
  const mod = await requireModerator();
  if ("error" in mod) return mod;
  const supabase = await createClient();
  const { data: waiting } = await supabase
    .from("shorts")
    .select(COLUMNS)
    .in("status", ["uploading", "processing"])
    .limit(50);
  await syncStuck((waiting ?? []) as Row[]);
  const { data } = await supabase
    .from("shorts")
    .select(COLUMNS)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true })
    .limit(50);
  return withAuthors((data ?? []) as Row[]);
}

export async function reviewShort(
  id: string,
  decision: "approve" | "reject",
  reason?: string,
): Promise<{ ok: true } | { error: string }> {
  const mod = await requireModerator();
  if ("error" in mod) return mod;
  const supabase = await createClient();
  const patch =
    decision === "approve"
      ? { status: "approved", approved_at: new Date().toISOString(), rejection_reason: null }
      : { status: "rejected", rejection_reason: reason?.trim().slice(0, 300) || null };
  const { error } = await supabase.from("shorts").update(patch).eq("id", id).eq("status", "pending_review");
  if (error) return { error: "Couldn't save that decision." };
  revalidatePath("/shorts");
  revalidatePath("/dashboard/moderation");
  return { ok: true };
}

export async function deleteShort(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };
  const { data: row } = await supabase.from("shorts").select("stream_uid").eq("id", id).maybeSingle();
  if (!row) return { error: "Short not found." };
  const { error } = await supabase.from("shorts").delete().eq("id", id);
  if (error) return { error: "Couldn't delete that short." };
  if (row.stream_uid) await deleteStreamVideo(row.stream_uid as string);
  revalidatePath("/shorts");
  revalidatePath("/shorts/mine");
  return { ok: true };
}
