import { NextRequest, NextResponse } from "next/server";

import {
  bibleAiHandoffUrl,
  createBibleAiHandoffToken,
  isBibleAiHandoffConfigured,
} from "@/lib/bible-ai-handoff";
import { BTW_XGESIS_PARTNER_ID } from "@/lib/bible-ai-config";
import { createClient } from "@/utils/supabase/server";

function safeNext(raw: string | null): string {
  const path = (raw ?? "/ask").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/ask";
  if (path.startsWith("/auth/") || path === "/locked") return "/ask";
  return path;
}

function safePartner(raw: string | null): string {
  const partner = (raw ?? BTW_XGESIS_PARTNER_ID).trim().toLowerCase();
  return partner || BTW_XGESIS_PARTNER_ID;
}

function ssoReturnPath(next: string, partner: string): string {
  const params = new URLSearchParams({ next, partner });
  return `/api/bible-ai/sso?${params.toString()}`;
}

export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const partner = safePartner(req.nextUrl.searchParams.get("partner"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("next", ssoReturnPath(next, partner));
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
    partner,
  });

  return NextResponse.redirect(bibleAiHandoffUrl(token, next, partner));
}
