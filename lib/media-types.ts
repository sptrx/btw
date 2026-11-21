/**
 * Allowed upload types. Deliberately an explicit list, not `image/*`:
 * image/svg+xml can carry script and would be served from our R2 domain.
 */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const MEDIA_ACCEPT_ATTR = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",");
export const IMAGE_ACCEPT_ATTR = ALLOWED_IMAGE_TYPES.join(",");

export function isAllowedImageType(mime: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mime.toLowerCase());
}
export function isAllowedMediaType(mime: string): boolean {
  const m = mime.toLowerCase();
  return isAllowedImageType(m) || (ALLOWED_VIDEO_TYPES as readonly string[]).includes(m);
}

/**
 * Check the file's first bytes match the type the browser claimed, so a
 * renamed HTML/SVG file can't be stored as "image/png". Only possible where
 * the server sees the bytes (proxy upload, avatars) — not for presigned PUTs.
 */
export function bytesMatchMime(bytes: Uint8Array, mime: string): boolean {
  const m = mime.toLowerCase();
  const at = (i: number, sig: number[]) => sig.every((b, k) => bytes[i + k] === b);
  if (m === "image/jpeg") return at(0, [0xff, 0xd8, 0xff]);
  if (m === "image/png") return at(0, [0x89, 0x50, 0x4e, 0x47]);
  if (m === "image/gif") return at(0, [0x47, 0x49, 0x46, 0x38]);
  if (m === "image/webp") return at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50]);
  if (m === "video/mp4" || m === "video/quicktime") return at(4, [0x66, 0x74, 0x79, 0x70]); // "ftyp"
  if (m === "video/webm") return at(0, [0x1a, 0x45, 0xdf, 0xa3]);
  return false;
}
