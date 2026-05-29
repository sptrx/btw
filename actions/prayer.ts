"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  moderateContent,
  approvedModerationOrFilter,
  isMissingModerationStatusColumn,
} from "@/lib/moderation";
import { PENDING_REVIEW_MESSAGE } from "@/lib/moderation-messages";
import {
  getProfile,
  hasAcceptedContentDisclaimer,
  recordContentDisclaimerAcceptance,
} from "@/actions";
import type { ProfileNameSnippet } from "@/lib/profile-fields";
import { getFollowedUserIds } from "@/actions/follows";
import { ANONYMOUS_LABEL } from "@/lib/prayer-display";
import {
  countryCodesInRegion,
  countryFlagEmoji,
  countryName,
  isGeoRegionId,
  normalizeCountryCode,
} from "@/lib/geo";
import type { GeoRegionId } from "@/lib/geo";
import { isMissingGeoColumn, resolveContentGeo } from "@/lib/geo/resolve-content-country";
import { visiblePrayerCountryCode } from "@/lib/prayer-geo";

export type PrayerRequestStatus = "active" | "answered" | "closed";
export type PrayerWallFilter = "all" | "unanswered" | "answered" | "mine";

export type PrayerRequestListItem = {
  id: string;
  title: string;
  body: string;
  isAnonymous: boolean;
  status: PrayerRequestStatus;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorDisplayName: string | null;
  authorUsername?: string | null;
  viewerFollowsAuthor?: boolean;
  prayerCount: number;
  userIsPraying: boolean;
  isOwner: boolean;
  countryCode?: string | null;
  countryName?: string | null;
  countryFlag?: string;
};

export type PrayerWallGeoFilter = {
  regionId?: GeoRegionId | null;
  countryCode?: string | null;
};

export type PrayerRequestDetail = PrayerRequestListItem;

export type PraiseReportItem = {
  id: string;
  body: string;
  createdAt: string;
  authorDisplayName: string | null;
  prayerRequestId: string | null;
  prayerRequestTitle: string | null;
};

export type PrayerCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  authorDisplayName: string | null;
  authorId: string;
};

function authorLabel(
  profile: ProfileNameSnippet,
  isAnonymous: boolean,
  viewerId: string | null,
  authorId: string
): string | null {
  if (isAnonymous && viewerId !== authorId) return ANONYMOUS_LABEL;
  return profile?.display_name?.trim() || null;
}

type ProfileSnippet = ProfileNameSnippet & { username?: string | null };

async function attachProfiles<T extends { user_id: string }>(
  rows: T[]
): Promise<Map<string, ProfileSnippet>> {
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

async function prayerCountsByRequest(
  requestIds: string[]
): Promise<Map<string, number>> {
  if (requestIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("prayer")
    .select("prayer_request_id")
    .in("prayer_request_id", requestIds);
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.prayer_request_id, (counts.get(row.prayer_request_id) ?? 0) + 1);
  }
  return counts;
}

async function userPrayingSet(
  requestIds: string[],
  userId: string | null
): Promise<Set<string>> {
  if (!userId || requestIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("prayer")
    .select("prayer_request_id")
    .eq("user_id", userId)
    .in("prayer_request_id", requestIds);
  return new Set((data ?? []).map((r) => r.prayer_request_id));
}

function mapRequestRow(
  row: {
    id: string;
    user_id: string;
    title: string;
    body: string;
    is_anonymous: boolean;
    status: PrayerRequestStatus;
    created_at: string;
    updated_at: string;
    country_code?: string | null;
  },
  profile: ProfileSnippet | null,
  viewerId: string | null,
  prayerCount: number,
  userIsPraying: boolean,
  followedUserIds: Set<string>
): PrayerRequestListItem {
  const anonymous = row.is_anonymous && viewerId !== row.user_id;
  const visibleCountry = visiblePrayerCountryCode(
    row.country_code,
    row.is_anonymous,
    row.user_id,
    viewerId
  );
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    isAnonymous: row.is_anonymous,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorId: row.user_id,
    authorDisplayName: authorLabel(profile, row.is_anonymous, viewerId, row.user_id),
    authorUsername: anonymous ? null : profile?.username ?? null,
    viewerFollowsAuthor: anonymous ? false : followedUserIds.has(row.user_id),
    prayerCount,
    userIsPraying,
    isOwner: viewerId === row.user_id,
    countryCode: visibleCountry,
    countryName: visibleCountry ? countryName(visibleCountry) : null,
    countryFlag: visibleCountry ? countryFlagEmoji(visibleCountry) : undefined,
  };
}

const PRAYER_SELECT =
  "id, user_id, title, body, is_anonymous, status, created_at, updated_at, country_code";

type PrayerRequestRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
  status: PrayerRequestStatus;
  created_at: string;
  updated_at: string;
  country_code?: string | null;
};

function applyPrayerGeoFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  geo: PrayerWallGeoFilter,
  withGeo: boolean
) {
  if (!withGeo) return query;
  const country = normalizeCountryCode(geo.countryCode);
  if (country) return query.eq("country_code", country);
  if (geo.regionId && isGeoRegionId(geo.regionId)) {
    const codes = countryCodesInRegion(geo.regionId);
    if (codes.length > 0) return query.in("country_code", codes);
  }
  return query;
}

export async function getPrayerWallFeed(
  filter: PrayerWallFilter = "all",
  limit = 40,
  geo: PrayerWallGeoFilter = {}
): Promise<PrayerRequestListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  const runQuery = (withGeo: boolean) => {
    let query = supabase
      .from("prayer_request")
      .select(withGeo ? PRAYER_SELECT : "id, user_id, title, body, is_anonymous, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    query = applyPrayerGeoFilter(query, geo, withGeo);
    return query;
  };

  let query = runQuery(true);

  if (filter === "mine") {
    if (!viewerId) return [];
    query = query.eq("user_id", viewerId);
  } else if (filter === "unanswered") {
    query = query.eq("status", "active");
  } else if (filter === "answered") {
    query = query.eq("status", "answered");
  } else {
    query = query.in("status", ["active", "answered"]);
  }

  if (filter === "mine") {
    // Authors see all their requests regardless of moderation
  } else {
    query = query.or(approvedModerationOrFilter("moderation_status"));
  }

  let { data: rows, error } = await query;
  if (error && isMissingGeoColumn(error)) {
    ({ data: rows, error } = await runQuery(false));
  }
  if (error) {
    console.error("[getPrayerWallFeed]", error);
    return [];
  }

  const list = (rows ?? []) as unknown as PrayerRequestRow[];
  const profiles = await attachProfiles(list);
  const ids = list.map((r) => r.id);
  const [counts, praying, followedUserIds] = await Promise.all([
    prayerCountsByRequest(ids),
    userPrayingSet(ids, viewerId),
    getFollowedUserIds(viewerId),
  ]);

  return list.map((row) =>
    mapRequestRow(
      row,
      profiles.get(row.user_id) ?? null,
      viewerId,
      counts.get(row.id) ?? 0,
      praying.has(row.id),
      followedUserIds
    )
  );
}

export async function getPrayerRequestById(
  id: string
): Promise<PrayerRequestDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  let { data: row, error } = await supabase
    .from("prayer_request")
    .select(`${PRAYER_SELECT}, moderation_status`)
    .eq("id", id)
    .maybeSingle();

  if (error && isMissingGeoColumn(error)) {
    ({ data: row, error } = await supabase
      .from("prayer_request")
      .select("id, user_id, title, body, is_anonymous, status, created_at, updated_at, moderation_status")
      .eq("id", id)
      .maybeSingle());
  }

  if (error || !row) return null;

  const typedRow = row as unknown as PrayerRequestRow & {
    moderation_status?: string | null;
  };

  const isOwner = viewerId === typedRow.user_id;
  if (
    typedRow.moderation_status !== "approved" &&
    typedRow.moderation_status != null &&
    !isOwner
  ) {
    return null;
  }

  const profiles = await attachProfiles([typedRow]);
  const [counts, praying, followedUserIds] = await Promise.all([
    prayerCountsByRequest([typedRow.id]),
    userPrayingSet([typedRow.id], viewerId),
    getFollowedUserIds(viewerId),
  ]);

  return mapRequestRow(
    typedRow,
    profiles.get(row.user_id) ?? null,
    viewerId,
    counts.get(row.id) ?? 0,
    praying.has(row.id),
    followedUserIds
  );
}

export async function getPraiseReports(limit = 20): Promise<PraiseReportItem[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("praise_report")
    .select("id, user_id, body, prayer_request_id, created_at")
    .or(approvedModerationOrFilter("moderation_status"))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getPraiseReports]", error);
    return [];
  }

  const list = rows ?? [];
  const profiles = await attachProfiles(list);
  const requestIds = list
    .map((r) => r.prayer_request_id)
    .filter((id): id is string => Boolean(id));

  let titles = new Map<string, string>();
  if (requestIds.length > 0) {
    const { data: requests } = await supabase
      .from("prayer_request")
      .select("id, title")
      .in("id", requestIds);
    titles = new Map((requests ?? []).map((r) => [r.id, r.title]));
  }

  return list.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    authorDisplayName: profiles.get(row.user_id)?.display_name?.trim() ?? null,
    prayerRequestId: row.prayer_request_id,
    prayerRequestTitle: row.prayer_request_id
      ? titles.get(row.prayer_request_id) ?? null
      : null,
  }));
}

export async function getHomepagePrayerRequests(
  limit = 3
): Promise<PrayerRequestListItem[]> {
  const supabase = await createClient();
  let rows: PrayerRequestRow[] | null = null;
  let error: { message?: string; code?: string } | null = null;

  const primary = await supabase
    .from("prayer_request")
    .select(PRAYER_SELECT)
    .eq("status", "active")
    .or(approvedModerationOrFilter("moderation_status"))
    .order("created_at", { ascending: false })
    .limit(limit);

  rows = primary.data as unknown as PrayerRequestRow[] | null;
  error = primary.error;

  if (error && isMissingGeoColumn(error)) {
    const fallback = await supabase
      .from("prayer_request")
      .select("id, user_id, title, body, is_anonymous, status, created_at, updated_at")
      .eq("status", "active")
      .or(approvedModerationOrFilter("moderation_status"))
      .order("created_at", { ascending: false })
      .limit(limit);
    rows = fallback.data as unknown as PrayerRequestRow[] | null;
    error = fallback.error;
  }

  if (error) {
    console.error("[getHomepagePrayerRequests]", error);
    return [];
  }

  const list = rows ?? [];
  const profiles = await attachProfiles(list);
  const ids = list.map((r) => r.id);
  const counts = await prayerCountsByRequest(ids);

  return list.map((row) =>
    mapRequestRow(
      row,
      profiles.get(row.user_id) ?? null,
      null,
      counts.get(row.id) ?? 0,
      false,
      new Set()
    )
  );
}

export async function getPrayerComments(
  prayerRequestId: string
): Promise<PrayerCommentItem[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("prayer_request_comment")
    .select("id, user_id, body, created_at")
    .eq("prayer_request_id", prayerRequestId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getPrayerComments]", error);
    return [];
  }

  const list = (rows ?? []) as unknown as PrayerRequestRow[];
  const profiles = await attachProfiles(list);
  return list.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    authorId: row.user_id,
    authorDisplayName: profiles.get(row.user_id)?.display_name?.trim() ?? null,
  }));
}

export async function createPrayerRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/prayer/new");

  const acceptedDisclaimer = formData.get("accepted_disclaimer") === "1";
  const alreadyAccepted = await hasAcceptedContentDisclaimer(user.id);
  if (!alreadyAccepted && !acceptedDisclaimer) {
    return { error: "Please accept the content disclaimer before submitting." };
  }

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const isAnonymous = formData.get("is_anonymous") === "on";

  if (!title || title.length > 200) {
    return { error: "Please add a title (max 200 characters)." };
  }
  if (!body || body.length > 5000) {
    return { error: "Please share your prayer request (max 5000 characters)." };
  }

  const result = await moderateContent([title, body].join("\n"), {
    contentType: "prayer",
  });
  if (!result.allowed) return { error: result.reason ?? "Request not allowed." };

  const moderationStatus = result.pendingReview ? "pending_review" : "approved";

  if (!alreadyAccepted && acceptedDisclaimer) {
    await recordContentDisclaimerAcceptance(user.id);
  }

  const authorProfile = await getProfile(user.id);
  const geoFields = resolveContentGeo(formData, authorProfile?.country_code);

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    title,
    body,
    is_anonymous: isAnonymous,
    status: "active",
    moderation_status: moderationStatus,
    country_code: geoFields.country_code,
    region: geoFields.region,
  };

  let { data: inserted, error: insertErr } = await supabase
    .from("prayer_request")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertErr && isMissingModerationStatusColumn(insertErr)) {
    delete insertPayload.moderation_status;
    ({ data: inserted, error: insertErr } = await supabase
      .from("prayer_request")
      .insert(insertPayload)
      .select("id")
      .single());
  }

  if (insertErr && isMissingGeoColumn(insertErr)) {
    delete insertPayload.country_code;
    delete insertPayload.region;
    ({ data: inserted, error: insertErr } = await supabase
      .from("prayer_request")
      .insert(insertPayload)
      .select("id")
      .single());
  }

  if (insertErr) {
    console.error("[createPrayerRequest]", insertErr);
    return { error: insertErr.message };
  }

  revalidatePath("/prayer");
  revalidatePath("/");
  revalidatePath("/map");
  revalidatePath("/feed");

  if (moderationStatus === "pending_review") {
    return { success: true, pendingReview: true, message: PENDING_REVIEW_MESSAGE };
  }

  redirect(`/prayer/${inserted!.id}`);
}

export async function togglePrayer(prayerRequestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to pray for this request.", needsAuth: true };

  const { data: existing } = await supabase
    .from("prayer")
    .select("id")
    .eq("prayer_request_id", prayerRequestId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("prayer").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase.from("prayer").insert({
      prayer_request_id: prayerRequestId,
      user_id: user.id,
    });
    if (error) {
      console.error("[togglePrayer] insert", error);
      return { error: error.message };
    }
  }

  revalidatePath("/prayer");
  revalidatePath(`/prayer/${prayerRequestId}`);
  revalidatePath("/");
  return { success: true, praying: !existing };
}

export async function markPrayerAnswered(
  prayerRequestId: string,
  praiseBody: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const body = praiseBody.trim();
  if (!body || body.length > 5000) {
    return { error: "Please share how God answered (max 5000 characters)." };
  }

  const { data: request } = await supabase
    .from("prayer_request")
    .select("id, user_id, title, status")
    .eq("id", prayerRequestId)
    .single();

  if (!request || request.user_id !== user.id) {
    return { error: "You can only mark your own requests as answered." };
  }

  const result = await moderateContent(body, { contentType: "prayer" });
  if (!result.allowed) return { error: result.reason ?? "Praise report not allowed." };

  const moderationStatus = result.pendingReview ? "pending_review" : "approved";

  const { error: praiseErr } = await supabase.from("praise_report").insert({
    user_id: user.id,
    body,
    prayer_request_id: prayerRequestId,
    linked_prayer_id: prayerRequestId,
    moderation_status: moderationStatus,
  });

  if (praiseErr) {
    console.error("[markPrayerAnswered] praise", praiseErr);
    return { error: praiseErr.message };
  }

  await supabase
    .from("prayer_request")
    .update({ status: "answered", updated_at: new Date().toISOString() })
    .eq("id", prayerRequestId);

  revalidatePath("/prayer");
  revalidatePath(`/prayer/${prayerRequestId}`);
  revalidatePath("/");

  if (moderationStatus === "pending_review") {
    return { success: true, pendingReview: true, message: PENDING_REVIEW_MESSAGE };
  }

  return { success: true };
}

export async function addPrayerComment(prayerRequestId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to leave encouragement.", needsAuth: true };

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { error: "Comment must be between 1 and 2000 characters." };
  }

  const result = await moderateContent(trimmed, { contentType: "comment" });
  if (!result.allowed) return { error: result.reason ?? "Comment not allowed." };

  const { error } = await supabase.from("prayer_request_comment").insert({
    prayer_request_id: prayerRequestId,
    user_id: user.id,
    body: trimmed,
  });

  if (error) {
    console.error("[addPrayerComment]", error);
    return { error: error.message };
  }

  revalidatePath(`/prayer/${prayerRequestId}`);
  return { success: true };
}
