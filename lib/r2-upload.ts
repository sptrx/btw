import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  buildPublicUrl,
  isR2Configured,
  uploadBufferToR2,
} from "@/lib/cloudflare-r2";

const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

function missingR2EnvKeys(): string[] {
  return R2_ENV_KEYS.filter((key) => !process.env[key]?.trim());
}

/** True when S3 API env vars are all set (local dev / presign). */
export function isR2S3Configured(): boolean {
  return isR2Configured();
}

export async function hasR2WorkerBinding(): Promise<boolean> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return Boolean(env.R2_MEDIA_BUCKET);
  } catch {
    return false;
  }
}

/** Upload available via Worker binding and/or S3 API credentials. */
export async function isR2UploadAvailable(): Promise<boolean> {
  if (isR2S3Configured()) return true;
  return hasR2WorkerBinding();
}

export type R2UploadStatus = {
  uploadEnabled: boolean;
  viaBinding: boolean;
  viaS3Api: boolean;
  missingEnvKeys: string[];
};

export async function getR2UploadStatus(): Promise<R2UploadStatus> {
  const viaBinding = await hasR2WorkerBinding();
  const viaS3Api = isR2S3Configured();
  const missingEnvKeys = missingR2EnvKeys();
  return {
    uploadEnabled: viaBinding || viaS3Api,
    viaBinding,
    viaS3Api,
    missingEnvKeys,
  };
}

function safeUploadErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Upload failed.";
  const msg = error.message;
  if (/AccessDenied|403|Forbidden/i.test(msg)) {
    return "R2 denied the upload. Check API token permissions for Object Read & Write.";
  }
  if (/NoSuchBucket|not found/i.test(msg)) {
    return "R2 bucket not found. Ensure wrangler r2_buckets.bucket_name matches R2_BUCKET_NAME.";
  }
  if (/ENOTFOUND|fetch failed|network/i.test(msg)) {
    return "Could not reach R2. On Cloudflare Workers, add the R2 bucket binding in wrangler.jsonc and redeploy.";
  }
  return msg.length > 180 ? `${msg.slice(0, 177)}…` : msg;
}

/**
 * Upload bytes to R2. Prefers the Cloudflare Worker R2 binding (reliable on Workers);
 * falls back to the AWS S3-compatible API for local `next dev`.
 */
export async function uploadBytesToR2(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<void> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bucket = env.R2_MEDIA_BUCKET;
    if (bucket) {
      await bucket.put(key, body, {
        httpMetadata: { contentType },
      });
      return;
    }
  } catch (bindingErr) {
    if (!isR2S3Configured()) {
      throw bindingErr instanceof Error
        ? bindingErr
        : new Error("R2 binding unavailable and S3 API env vars are not set.");
    }
  }

  if (!isR2S3Configured()) {
    throw new Error(
      "R2 is not configured. Set R2_* on the Worker or add r2_buckets binding in wrangler.jsonc."
    );
  }

  await uploadBufferToR2(key, Buffer.from(body), contentType);
}

export { buildPublicUrl, safeUploadErrorMessage };
