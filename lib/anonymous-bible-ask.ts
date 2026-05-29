import "server-only";

import { createClient } from "@/utils/supabase/server";

export function anonymousBibleAskHourlyLimit(): number {
  const n = Number(process.env.BTW_ANON_BIBLE_ASK_PER_HOUR ?? 3);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

export type AnonymousAskGateResult =
  | { allowed: true; remaining: number }
  | { allowed: false; error: string; remaining?: number };

/**
 * Enforce hourly anonymous Bible Q&A limit via Supabase RPC.
 * Fails open if migration is not applied yet.
 */
export async function checkAnonymousBibleAskLimit(
  ipHash: string,
): Promise<AnonymousAskGateResult> {
  const limit = anonymousBibleAskHourlyLimit();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_anonymous_bible_ask", {
    p_ip_hash: ipHash,
    p_limit: limit,
  });

  if (error) {
    if (
      error.code === "42883" ||
      error.message?.includes("check_anonymous_bible_ask") ||
      error.message?.includes("does not exist")
    ) {
      return { allowed: true, remaining: limit };
    }
    console.error("[anonymous-bible-ask]", error);
    return { allowed: true, remaining: limit };
  }

  const row = data as { allowed?: boolean; remaining?: number; error?: string } | null;
  if (row?.allowed === false) {
    return {
      allowed: false,
      error:
        typeof row.error === "string" && row.error.trim()
          ? row.error
          : `You can ask up to ${limit} questions per hour without signing in.`,
      remaining: typeof row.remaining === "number" ? row.remaining : 0,
    };
  }

  const remaining =
    typeof row?.remaining === "number" ? Math.max(0, row.remaining) : limit - 1;
  return { allowed: true, remaining };
}

export function anonymousBibleAiUserId(ipHash: string): string {
  return `btw-anon-${ipHash.slice(0, 40)}`;
}
