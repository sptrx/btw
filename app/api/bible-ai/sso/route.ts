import { NextRequest, NextResponse } from "next/server";

import {
  bibleAiHandoffUrl,
  createBibleAiHandoffToken,
  isBibleAiHandoffConfigured,
} from "@/lib/bible-ai-handoff";
import { createClient } from "@/utils/supabase/server";

function safeNext(raw: string | null): string {
  const path = (raw ?? "/ask").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/ask";
  return path;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = safeNext(req.nextUrl.searchParams.get("next"));
    const login = new URL("/auth/login", req.url);
    login.searchParams.set(
      "next",
      `/api/bible-ai/sso?next=${encodeURIComponent(next)}`,
    );
    return NextResponse.redirect(login);
  }

  if (!isBibleAiHandoffConfigured()) {
    return NextResponse.json(
      {
        error: "Bible Q&A SSO is not configured.",
        hint: "Set BIBLE_AI_HANDOFF_SECRET (same on bible-ai) and BIBLE_AI_PUBLIC_ORIGIN.",
      },
      { status: 503 },
    );
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof meta?.full_name === "string"
      ? meta.full_name.trim()
      : typeof meta?.name === "string"
        ? meta.name.trim()
        : undefined;

  const token = await createBibleAiHandoffToken({
    userId: user.id,
    email: user.email,
    name: fullName,
  });

  const next = safeNext(req.nextUrl.searchParams.get("next"));
  return NextResponse.redirect(bibleAiHandoffUrl(token, next));
}
