"use client";

import { useState } from "react";
import Link from "next/link";
import { createImplicitRecoveryClient } from "@/utils/supabase/client";
import { authInputClass, authPrimaryButtonClass } from "@/lib/auth-form-styles";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Must use createImplicitRecoveryClient() — @supabase/ssr createBrowserClient forces PKCE.
      const supabase = createImplicitRecoveryClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const invalid = !!error;

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="btw-auth-panel">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Reset password</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        {sent ? (
          <div className="space-y-4">
            <p className="text-primary text-sm">
              Check your email. We&apos;ve sent a password reset link to <strong>{email}</strong>.
            </p>
            <p className="text-muted-foreground text-sm">
              Didn&apos;t receive it? Check spam or{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-primary font-medium hover:underline"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/auth/login"
              className="block text-center text-sm text-primary font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={invalid}
                aria-describedby={invalid ? "forgot-error" : undefined}
                className={authInputClass}
              />
            </div>
            {error && (
              <p id="forgot-error" role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
