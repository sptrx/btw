import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementBibleAiQuota } from "@/lib/bible-ai-quota";
import { fetchBibleExplanation, isScriptureGuideConfigured } from "@/lib/bible-ai";
import {
  anonymousBibleAiUserId,
  checkAnonymousBibleAskLimit,
} from "@/lib/anonymous-bible-ask";
import { getClientIpFromRequest, hashIpForStorage } from "@/lib/client-ip";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const MAX_MESSAGE_LEN = 2000;
const MAX_HISTORY = 6;

type AskBody = {
  message?: string;
  translationId?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
};

export async function POST(req: NextRequest) {
  if (!isScriptureGuideConfigured()) {
    return NextResponse.json(
      {
        error: "Bible Q&A is not available right now.",
        hint: "Please try again later.",
      },
      { status: 503 },
    );
  }

  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      { error: `Please keep your question under ${MAX_MESSAGE_LEN} characters.` },
      { status: 400 },
    );
  }

  const translationId = String(body.translationId ?? "kjv").trim() || "kjv";
  const rawHistory = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawHistory
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        Boolean(m) &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userId: string;
  let anonymous = false;
  let remaining: number | undefined;

  if (user) {
    const quota = await checkAndIncrementBibleAiQuota(user.id);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: 429 });
    }
    userId = user.id;
    remaining = quota.remaining;
  } else {
    const ipHash = hashIpForStorage(getClientIpFromRequest(req));
    const gate = await checkAnonymousBibleAskLimit(ipHash);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          error: gate.error,
          hint: "Create a free account to save conversations and ask more questions.",
          anonymous: true,
        },
        { status: 429 },
      );
    }
    userId = anonymousBibleAiUserId(ipHash);
    anonymous = true;
    remaining = gate.remaining;
  }

  const result = await fetchBibleExplanation({
    userId,
    message,
    translationId,
    messages,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    response: result.response,
    citations: result.citations ?? [],
    anonymous,
    remaining,
  });
}
