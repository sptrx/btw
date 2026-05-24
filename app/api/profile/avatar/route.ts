import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  buildPublicUrl,
  getProxyMaxBytes,
  isR2Configured,
  sanitizeFileName,
  uploadBufferToR2,
} from "@/lib/cloudflare-r2";

export const runtime = "nodejs";
export const maxDuration = 60;

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Avatar upload is not configured. Paste an image URL instead." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload an avatar." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed for avatars." }, { status: 400 });
  }

  const maxBytes = Math.min(AVATAR_MAX_BYTES, getProxyMaxBytes());
  if (file.size < 1 || file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return NextResponse.json({ error: `Image must be under ${mb} MB.` }, { status: 400 });
  }

  const safeName = sanitizeFileName(file.name);
  const key = `profiles/${user.id}/avatar-${Date.now()}-${randomBytes(8).toString("hex")}-${safeName}`;

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    await uploadBufferToR2(key, buf, contentType);
    const publicUrl = buildPublicUrl(key);
    return NextResponse.json({ publicUrl, key });
  } catch (e) {
    console.error("[profile/avatar]", e);
    return NextResponse.json({ error: "Upload failed. Try again or use an image URL." }, { status: 500 });
  }
}
