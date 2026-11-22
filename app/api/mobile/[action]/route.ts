import { NextRequest, NextResponse } from "next/server";
import { MobileApiError, mobileHandlers } from "@/lib/mobile-api";

export const runtime = "nodejs";

/** Expo web dev server runs on another origin; native apps don't send CORS preflights. */
const DEV_CORS: Record<string, string> =
  process.env.NODE_ENV === "production"
    ? {}
    : {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...DEV_CORS },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: DEV_CORS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const handler = Object.hasOwn(mobileHandlers, action) ? mobileHandlers[action] : undefined;
  if (!handler) return json({ error: "Unknown action." }, 404);

  let args: Record<string, unknown> = {};
  const text = await req.text();
  if (text) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      args = parsed as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid request body." }, 400);
    }
  }

  try {
    const result = await handler(args);
    const failure = result as { error?: unknown; needsAuth?: unknown } | null;
    if (failure && typeof failure.error === "string") {
      return json({ error: failure.error }, failure.needsAuth ? 401 : 400);
    }
    return json({ data: result ?? null });
  } catch (error) {
    if (error instanceof MobileApiError) return json({ error: error.message }, error.status);
    console.error(`[api/mobile/${action}]`, error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
