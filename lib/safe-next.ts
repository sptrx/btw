/**
 * Validate a `?next=` redirect target. Only same-site relative paths are
 * allowed — blocks open redirects (`//evil.com`, `/\evil.com`, `https://…`)
 * and script URLs (`javascript:…`). Safe to use on the client and server.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // Browsers treat "\" like "/" ("/\evil.com" → "//evil.com"); reject it and control chars.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;

  const base = "https://btw.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
