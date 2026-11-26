import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_MATCH_RULE,
  PASSWORD_RULES,
  PASSWORD_SYMBOLS,
  passwordPolicyError,
  passwordTooShortMessage,
} from "@/lib/password-policy";

describe("password policy", () => {
  it("matches the Supabase minimum of 10", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(10);
  });

  it("builds a message from the shared constant", () => {
    expect(passwordTooShortMessage()).toBe("Password must be at least 10 characters.");
    expect(passwordTooShortMessage("New password")).toBe("New password must be at least 10 characters.");
  });

  it("lists the rules shown on password forms", () => {
    expect(PASSWORD_RULES).toEqual([
      "At least 10 characters",
      "A lowercase letter",
      "An uppercase letter",
      "A number",
      "A symbol",
    ]);
    expect(PASSWORD_MATCH_RULE).toBe("Enter the same password in both fields");
  });

  it("matches the Supabase character classes", () => {
    expect(passwordPolicyError("short")).toBe(
      "Password must be at least 10 characters and include an uppercase letter, a number, and a symbol."
    );
    expect(passwordPolicyError("longenough")).toBe(
      "Password must include an uppercase letter, a number, and a symbol."
    );
    expect(passwordPolicyError("Password1!")).toBeNull();
    for (const symbol of PASSWORD_SYMBOLS) {
      expect(passwordPolicyError(`Password1${symbol}`)).toBeNull();
    }
  });
});
