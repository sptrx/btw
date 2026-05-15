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
        <label className="mb-1 block text-sm font-medium text-foreground">
          Current email
        </label>
        <p className="break-all rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
          {currentEmail || "—"}
        </p>
      </div>
      <div>
        <label
          htmlFor="new_email"
          className="mb-1 block text-sm font-medium text-foreground"
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
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="email_current_password"
          className="mb-1 block text-sm font-medium text-foreground"
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
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Required for email/password accounts. OAuth users can leave this blank.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {pendingEmail && (
        <div className="space-y-1 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <p>
            We sent a verification link to{" "}
            <span className="font-medium break-all">{pendingEmail}</span>. Open it on this
            browser to finish the change.
          </p>
          <p className="text-muted-foreground">
            For security, we may also email your current address ({currentEmail}) to confirm
            this change.
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
      >
        {loading ? "Sending verification…" : "Change email"}
      </button>
    </form>
  );
}
