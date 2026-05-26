import "server-only";

import { createClient } from "@/utils/supabase/server";

/** Max scripture-guide / bible-ai calls per user per UTC day (BTW-side guard). */
export function bibleAiDailyLimit(): number {
  const n = Number(process.env.BTW_BIBLE_AI_DAILY_LIMIT ?? 30);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export type QuotaCheckResult =
  | { allowed: true; remaining: number }
  | { allowed: false; error: string };

/**
 * Check and increment daily usage before calling bible-ai.
 * Fails open if the table is missing (migration not applied yet).
 */
export async function checkAndIncrementBibleAiQuota(
  userId: string,
): Promise<QuotaCheckResult> {
  const limit = bibleAiDailyLimit();
  const supabase = await createClient();
  const usageDate = utcToday();

  const { data: row, error: selectErr } = await supabase
    .from("bible_ai_daily_usage")
    .select("request_count")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .maybeSingle();

  if (selectErr) {
    if (selectErr.code === "42P01" || selectErr.message?.includes("does not exist")) {
      return { allowed: true, remaining: limit };
    }
    console.error("[bible-ai-quota] select", selectErr);
    return { allowed: true, remaining: limit };
  }

  const current = row?.request_count ?? 0;
  if (current >= limit) {
    return {
      allowed: false,
      error: `You have reached today's limit of ${limit} Scripture guide requests. Try again tomorrow.`,
    };
  }

  if (row) {
    const { error: updErr } = await supabase
      .from("bible_ai_daily_usage")
      .update({ request_count: current + 1 })
      .eq("user_id", userId)
      .eq("usage_date", usageDate);

    if (updErr) {
      console.error("[bible-ai-quota] update", updErr);
      return { allowed: true, remaining: limit - current - 1 };
    }
  } else {
    const { error: insErr } = await supabase.from("bible_ai_daily_usage").insert({
      user_id: userId,
      usage_date: usageDate,
      request_count: 1,
    });

    if (insErr) {
      console.error("[bible-ai-quota] insert", insErr);
      return { allowed: true, remaining: limit - 1 };
    }
  }

  return { allowed: true, remaining: limit - current - 1 };
}
