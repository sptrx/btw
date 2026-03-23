import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Default limits — tune via env if needed */
const DEFAULT_MAX_IMAGE_MB = 25;
const DEFAULT_MAX_VIDEO_MB = 400;

/**
 * R2 is S3-compatible. Required env:
 * - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 * - R2_PUBLIC_URL — public base for objects (custom domain, r2.dev, or Cloudflare CDN URL), no trailing slash
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  );
}

/** Public HTTPS URL stored in topic_content.media_urls */
export function buildPublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
  return `${base}/${key}`;
}

export function sanitizeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return base || "file";
}

export function getR2S3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function getMaxBytesForMime(mime: string): number {
  const imageMb = Number(process.env.R2_MAX_IMAGE_MB) || DEFAULT_MAX_IMAGE_MB;
  const videoMb = Number(process.env.R2_MAX_VIDEO_MB) || DEFAULT_MAX_VIDEO_MB;
  if (mime.startsWith("video/")) return videoMb * 1024 * 1024;
  if (mime.startsWith("image/")) return imageMb * 1024 * 1024;
  return 0;
}

export async function createPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getR2S3Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/** Server-side upload (no browser CORS to R2). Prefer for smaller files; see R2_PROXY_MAX_MB. */
export async function uploadBufferToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  const client = getR2S3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/** Max size for server-proxy upload (bytes). Default 8 MiB — within many serverless body limits. */
export function getProxyMaxBytes(): number {
  const mb = Number(process.env.R2_PROXY_MAX_MB);
  const n = Number.isFinite(mb) && mb > 0 ? mb : 8;
  return Math.floor(n * 1024 * 1024);
}
