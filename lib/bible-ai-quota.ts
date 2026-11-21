import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";

/** Max scripture-guide / bible-ai calls per user per UTC day (BTW-side guard). */
export function bibleAiDailyLimit(): number {
  const n = Number(process.env.BTW_BIBLE_AI_DAILY_LIMIT ?? 30);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

export type QuotaCheckResult =
  | { allowed: true; remaining: number }
  | { allowed: false; error: string };

const QUOTA_UNAVAILABLE =
  "Scripture guide requests are temporarily unavailable. Please try again later.";

/**
 * Check and increment daily usage before calling bible-ai.
 *
 * Runs `consume_bible_ai_quota` with the service role: the check and the
 * increment happen in one statement (no race), and users have no write access
 * to `bible_ai_daily_usage`, so they can't reset their own counter.
 * Fails closed if the server can't record usage.
 */
export async function checkAndIncrementBibleAiQuota(
  userId: string,
): Promise<QuotaCheckResult> {
  const limit = bibleAiDailyLimit();
  const admin = createAdminClient();
  if (!admin) return { allowed: false, error: QUOTA_UNAVAILABLE };

  const { data, error } = await admin.rpc("consume_bible_ai_quota", {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    console.error("[bible-ai-quota] rpc", error.message);
    return { allowed: false, error: QUOTA_UNAVAILABLE };
  }

  const result = (data ?? {}) as { allowed?: boolean; remaining?: number };
  if (!result.allowed) {
    return {
      allowed: false,
      error: `You have reached today's limit of ${limit} Scripture guide requests. Try again tomorrow.`,
    };
  }
  return { allowed: true, remaining: Math.max(0, Number(result.remaining ?? 0)) };
}
