export const ANONYMOUS_LABEL = "A sister/brother in Christ";

export function truncateBody(text: string, max = 200): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}
