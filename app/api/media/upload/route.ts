import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  buildPublicUrl,
  getMaxBytesForMime,
  getProxyMaxBytes,
  isR2Configured,
  sanitizeFileName,
  uploadBufferToR2,
} from "@/lib/cloudflare-r2";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "R2 is not configured. Set R2_* environment variables." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload media." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body." }, { status: 400 });
  }

  const channelId = (formData.get("channelId") as string)?.trim();
  const file = formData.get("file");

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
    return NextResponse.json({ error: "Only image/* and video/* uploads are allowed." }, { status: 400 });
  }

  const maxBytes = Math.min(getMaxBytesForMime(contentType), getProxyMaxBytes());
  if (file.size < 1 || file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return NextResponse.json(
      {
        error: `File too large for direct upload (max ~${mb} MB). Use a smaller file or increase R2_PROXY_MAX_MB / use presigned flow for large files.`,
      },
      { status: 400 }
    );
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("author_id")
    .eq("id", channelId)
    .single();

  if (!topic || topic.author_id !== user.id) {
    return NextResponse.json({ error: "You can only upload to your own channels." }, { status: 403 });
  }

  const safeName = sanitizeFileName(file.name);
  const key = `channels/${channelId}/${Date.now()}-${randomBytes(8).toString("hex")}-${safeName}`;

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    await uploadBufferToR2(key, buf, contentType);
    const publicUrl = buildPublicUrl(key);
    const mediaType = contentType.startsWith("video/") ? "video" : "image";
    return NextResponse.json({ publicUrl, key, mediaType });
  } catch (e) {
    console.error("[media/upload]", e);
    return NextResponse.json({ error: "Upload to R2 failed. Check credentials and bucket." }, { status: 500 });
  }
}
