"use client";

import { useState } from "react";
import { updatePassword } from "@/actions/auth";

// userEmail is still passed by the settings page; the server action reads the session instead.
type Props = { userEmail?: string };

export default function PasswordChangeForm(_props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const newPassword = (formData.get("new_password") as string | null) ?? "";
    const confirmPassword = (formData.get("confirm_password") as string | null) ?? "";

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // The server checks the current password for email/password accounts.
      const result = await updatePassword(formData);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-md"
    >
      <div>
        <label
          htmlFor="current_password"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Current password
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your current password (leave blank if you use magic link/OAuth)"
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Required for email/password accounts. OAuth users can leave this blank.
        </p>
      </div>
      <div>
        <label
          htmlFor="new_password"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          New password
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="confirm_password"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Confirm new password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Repeat new password"
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-primary">Password updated successfully.</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
      >
        {loading ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
