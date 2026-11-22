import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, passwordTooShortMessage } from "@/lib/password-policy";

describe("password policy", () => {
  it("matches the Supabase minimum of 10", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(10);
  });

  it("builds a message from the shared constant", () => {
    expect(passwordTooShortMessage()).toBe("Password must be at least 10 characters.");
    expect(passwordTooShortMessage("New password")).toBe("New password must be at least 10 characters.");
  });
});
