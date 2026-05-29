/** Client-safe username validation (must match DB constraint). */

const USERNAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;

export function isValidUsername(value: string): boolean {
  const t = value.trim();
  return t.length >= 3 && t.length <= 30 && USERNAME_RE.test(t);
}

export function normalizeUsernameInput(value: string): string {
  return value.trim().toLowerCase();
}

export function slugifyUsernameCandidate(displayName: string): string {
  const base = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return base.length >= 3 ? base : "member";
}
