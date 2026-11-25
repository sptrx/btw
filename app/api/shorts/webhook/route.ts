import { NextRequest, NextResponse } from "next/server";
import { syncShortFromStream } from "@/lib/shorts-sync";
import { verifyStreamWebhook } from "@/lib/stream";

/** Cloudflare Stream calls this when a video finishes processing. */
export async function POST(req: NextRequest) {
  const secret = process.env.STREAM_WEBHOOK_SECRET?.trim() ?? "";
  const raw = await req.text();
  if (!verifyStreamWebhook(raw, req.headers.get("webhook-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }
  let uid: string | undefined;
  try {
    uid = (JSON.parse(raw) as { uid?: string }).uid;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (uid) await syncShortFromStream(uid);
  return NextResponse.json({ ok: true });
}
