"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { authInputClass, authPrimaryButtonClass } from "@/lib/auth-form-styles";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Ensure we're in recovery - user should have arrived via the email link
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const invalid = !!error;

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Set new password</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your new password below.
        </p>
        {success ? (
          <div className="space-y-4">
            <p className="text-primary text-sm">Your password has been updated.</p>
            <Link
              href="/auth/login"
              className="block w-full min-h-11 rounded-xl bg-primary px-4 py-3 text-center text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors touch-manipulation sm:text-sm"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate suppressHydrationWarning>
            <div className="space-y-2">
              <label htmlFor="reset-password-new" className="text-sm font-medium text-foreground">
                New password <span className="font-normal text-muted-foreground">(min 6 characters)</span>
              </label>
              <input
                id="reset-password-new"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={authInputClass}
                autoComplete="new-password"
                aria-invalid={invalid}
                aria-describedby={invalid ? "reset-error" : undefined}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="reset-password-confirm" className="text-sm font-medium text-foreground">
                Confirm new password
              </label>
              <input
                id="reset-password-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className={authInputClass}
                autoComplete="new-password"
                aria-invalid={invalid}
                aria-describedby={invalid ? "reset-error" : undefined}
              />
            </div>
            {error && (
              <p id="reset-error" role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
        <p className="mt-6 text-sm text-muted-foreground text-center">
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
