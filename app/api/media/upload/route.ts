import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getMaxBytesForMime,
  getProxyMaxBytes,
  sanitizeFileName,
} from "@/lib/cloudflare-r2";
import {
  buildPublicUrl,
  isR2UploadAvailable,
  safeUploadErrorMessage,
  uploadBytesToR2,
} from "@/lib/r2-upload";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!(await isR2UploadAvailable())) {
    return NextResponse.json(
      { error: "R2 is not configured. Set R2_* environment variables and/or the R2 bucket binding." },
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
    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadBytesToR2(key, bytes, contentType);
    const publicUrl = buildPublicUrl(key);
    const mediaType = contentType.startsWith("video/") ? "video" : "image";
    return NextResponse.json({ publicUrl, key, mediaType });
  } catch (e) {
    console.error("[media/upload]", e);
    return NextResponse.json(
      { error: safeUploadErrorMessage(e) },
      { status: 500 }
    );
  }
}
