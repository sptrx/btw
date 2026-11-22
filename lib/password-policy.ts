/**
 * Minimum password length. Keep in sync with Supabase → Authentication →
 * Sign In / Providers → "Minimum password length" (set to 10); Supabase
 * enforces it server-side, this keeps the forms from promising less.
 */
export const MIN_PASSWORD_LENGTH = 10;

export function passwordTooShortMessage(subject = "Password"): string {
  return `${subject} must be at least ${MIN_PASSWORD_LENGTH} characters.`;
}

/** Shown beside every place a person chooses a password. */
export const PASSWORD_RULES = [`At least ${MIN_PASSWORD_LENGTH} characters`] as const;

export const PASSWORD_MATCH_RULE = "Enter the same password in both fields";
