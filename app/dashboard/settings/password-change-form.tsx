"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Props = { userEmail: string };

export default function PasswordChangeForm({ userEmail }: Props) {
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
    const currentPassword = (formData.get("current_password") as string)?.trim();
    const newPassword = (formData.get("new_password") as string)?.trim();
    const confirmPassword = (formData.get("confirm_password") as string)?.trim();

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
      const supabase = createClient();

      // Verify current password if provided (email/password users)
      if (currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword,
        });
        if (signInError) {
          setError("Current password is incorrect.");
          setLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
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
          className="block text-sm font-medium mb-1 text-warm-700 dark:text-warm-300"
        >
          Current password
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your current password (leave blank if you use magic link/OAuth)"
          className="w-full px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl dark:bg-warm-800"
        />
        <p className="text-xs text-warm-500 mt-1">
          Required for email/password accounts. OAuth users can leave this blank.
        </p>
      </div>
      <div>
        <label
          htmlFor="new_password"
          className="block text-sm font-medium mb-1 text-warm-700 dark:text-warm-300"
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
          className="w-full px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl dark:bg-warm-800"
        />
      </div>
      <div>
        <label
          htmlFor="confirm_password"
          className="block text-sm font-medium mb-1 text-warm-700 dark:text-warm-300"
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
          className="w-full px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl dark:bg-warm-800"
        />
      </div>
      {error && <p className="text-terracotta-600 text-sm">{error}</p>}
      {success && (
        <p className="text-sage-600 dark:text-sage-400 text-sm">
          Password updated successfully.
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 font-medium transition-colors w-fit disabled:opacity-50"
      >
        {loading ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
