"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Props = { currentEmail: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailChangeForm({ currentEmail }: Props) {
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPendingEmail(null);

    const trimmedEmail = newEmail.trim().toLowerCase();
    const trimmedCurrent = (currentEmail ?? "").trim().toLowerCase();

    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (trimmedEmail === trimmedCurrent) {
      setError("That's already your current email.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Reauthenticate via current password when the user has one. OAuth/magic-link
      // accounts don't have a password — the active session is treated as proof of identity.
      const currentPwd = currentPassword.trim();
      if (currentPwd) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: currentPwd,
        });
        if (signInError) {
          setError("Current password is incorrect.");
          setLoading(false);
          return;
        }
      }

      const origin = window.location.origin;
      const { error: updateError } = await supabase.auth.updateUser(
        { email: trimmedEmail },
        {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
            "/auth/email-changed"
          )}`,
        }
      );

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setPendingEmail(trimmedEmail);
      setNewEmail("");
      setCurrentPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1 text-warm-700 dark:text-warm-300">
          Current email
        </label>
        <p className="px-4 py-2.5 border-2 border-warm-200 dark:border-warm-700 rounded-xl bg-warm-50/40 dark:bg-warm-800/40 text-warm-800 dark:text-warm-100 break-all">
          {currentEmail || "—"}
        </p>
      </div>
      <div>
        <label
          htmlFor="new_email"
          className="block text-sm font-medium mb-1 text-warm-700 dark:text-warm-300"
        >
          New email
        </label>
        <input
          id="new_email"
          name="new_email"
          type="email"
          autoComplete="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl dark:bg-warm-800"
        />
      </div>
      <div>
        <label
          htmlFor="email_current_password"
          className="block text-sm font-medium mb-1 text-warm-700 dark:text-warm-300"
        >
          Current password
        </label>
        <input
          id="email_current_password"
          name="email_current_password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter your current password (leave blank if you use magic link/OAuth)"
          className="w-full px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl dark:bg-warm-800"
        />
        <p className="text-xs text-warm-500 mt-1">
          Required for email/password accounts. OAuth users can leave this blank.
        </p>
      </div>
      {error && <p className="text-terracotta-600 text-sm">{error}</p>}
      {pendingEmail && (
        <div className="text-sm text-sage-700 dark:text-sage-300 bg-sage-50 dark:bg-sage-950/30 border border-sage-200 dark:border-sage-800 rounded-xl px-4 py-3 space-y-1">
          <p>
            We sent a verification link to{" "}
            <span className="font-medium break-all">{pendingEmail}</span>. Open it on this
            browser to finish the change.
          </p>
          <p className="text-warm-600 dark:text-warm-400">
            For security, we may also email your current address ({currentEmail}) to confirm
            this change.
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 font-medium transition-colors w-fit disabled:opacity-50"
      >
        {loading ? "Sending verification…" : "Change email"}
      </button>
    </form>
  );
}
