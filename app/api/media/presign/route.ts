import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  buildPublicUrl,
  createPresignedUploadUrl,
  getMaxBytesForMime,
  getProxyMaxBytes,
  isR2Configured,
  sanitizeFileName,
} from "@/lib/cloudflare-r2";

/** GET — upload config for the browser (R2 env + proxy size limit for server-side uploads). */
export async function GET() {
  const enabled = isR2Configured();
  return NextResponse.json({
    uploadEnabled: enabled,
    proxyMaxBytes: enabled ? getProxyMaxBytes() : 0,
  });
}

type PresignBody = {
  channelId?: string;
  filename?: string;
  contentType?: string;
  contentLength?: number;
};

export async function POST(req: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "Media uploads are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL.",
      },
      { status: 503 }
    );
  }

  let body: PresignBody;
  try {
    body = (await req.json()) as PresignBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { channelId, filename, contentType, contentLength } = body;

  if (!channelId || typeof channelId !== "string") {
    return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  }
  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "filename is required." }, { status: 400 });
  }
  if (!contentType || typeof contentType !== "string") {
    return NextResponse.json({ error: "contentType is required." }, { status: 400 });
  }
  if (typeof contentLength !== "number" || !Number.isFinite(contentLength) || contentLength < 1) {
    return NextResponse.json({ error: "contentLength must be a positive number." }, { status: 400 });
  }

  if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only image/* and video/* uploads are allowed." },
      { status: 400 }
    );
  }

  const maxBytes = getMaxBytesForMime(contentType);
  if (maxBytes === 0 || contentLength > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return NextResponse.json(
      { error: `File too large for this type (max ~${mb} MB).` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload media." }, { status: 401 });
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("author_id")
    .eq("id", channelId)
    .single();

  if (!topic || topic.author_id !== user.id) {
    return NextResponse.json({ error: "You can only upload to your own channels." }, { status: 403 });
  }

  const safeName = sanitizeFileName(filename);
  const key = `channels/${channelId}/${Date.now()}-${randomBytes(8).toString("hex")}-${safeName}`;

  try {
    const uploadUrl = await createPresignedUploadUrl(key, contentType);
    const publicUrl = buildPublicUrl(key);
    const mediaType = contentType.startsWith("video/") ? "video" : "image";

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
      mediaType,
    });
  } catch (e) {
    console.error("[presign]", e);
    return NextResponse.json(
      { error: "Could not create upload URL. Check R2 credentials, R2_PUBLIC_URL, and CORS." },
      { status: 500 }
    );
  }
}
