/**
 * Password rules. Keep in sync with Supabase → Authentication →
 * Sign In / Providers (minimum length 10, and one of each: lowercase,
 * uppercase, number, symbol) and with mobile/src/app/sign-up.tsx.
 * Supabase enforces this server-side; these checks stop the form from
 * promising less and then returning a raw 422.
 */
export const MIN_PASSWORD_LENGTH = 10;

/** Characters Supabase Auth counts as a symbol. */
export const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~";

export function passwordTooShortMessage(subject = "Password"): string {
  return `${subject} must be at least ${MIN_PASSWORD_LENGTH} characters.`;
}

/** Shown beside every place a person chooses a password. */
export const PASSWORD_RULES = [
  `At least ${MIN_PASSWORD_LENGTH} characters`,
  "A lowercase letter",
  "An uppercase letter",
  "A number",
  "A symbol",
] as const;

export const PASSWORD_MATCH_RULE = "Enter the same password in both fields";

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Null when the password meets the Supabase rules. */
export function passwordPolicyError(password: string, subject = "Password"): string | null {
  const classes: string[] = [];
  if (!/[a-z]/.test(password)) classes.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) classes.push("an uppercase letter");
  if (!/[0-9]/.test(password)) classes.push("a number");
  if (![...password].some((ch) => PASSWORD_SYMBOLS.includes(ch))) classes.push("a symbol");

  const parts: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) {
    parts.push(`be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (classes.length > 0) parts.push(`include ${joinList(classes)}`);
  if (parts.length === 0) return null;
  return `${subject} must ${joinList(parts)}.`;
}
