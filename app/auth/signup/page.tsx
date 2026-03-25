"use client";

import { useState } from "react";
import Link from "next/link";
import { createImplicitRecoveryClient } from "@/utils/supabase/client";
import { authInputClass, authPrimaryButtonClass } from "@/lib/auth-form-styles";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"user" | "channel_author">("user");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  /** true = confirmation email expected; false = already signed in (confirm email off) */
  const [awaitingEmail, setAwaitingEmail] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError("Please accept the terms and conditions to create an account.");
      return;
    }
    setLoading(true);

    try {
      // Implicit client (localStorage) so PKCE email links match /auth/callback’s implicit exchange. createBrowserClient
      // stores the verifier in cookies — often missing in mail-app webviews, so confirmation appears to “fail same browser”.
      const supabase = createImplicitRecoveryClient();
      const origin = window.location.origin;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/auth/confirmed")}`,
        },
      });
      if (signUpError) throw signUpError;

      // Duplicate email: Supabase returns 200 with user.identities === [] (no email sent; enumeration protection).
      if (data.user?.identities?.length === 0) {
        setError(
          "This email is already registered. Try signing in, or use “Forgot password” if you don’t remember your password."
        );
        return;
      }

      // Email confirmation disabled in project → session returned immediately; no confirmation mail is sent.
      if (data.session) {
        setAwaitingEmail(false);
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const invalid = !!error;

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12 sm:mt-20">
        <div
          className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-6 shadow-sm sm:p-8 space-y-4"
          role="status"
          aria-live="polite"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {awaitingEmail ? "Check your email" : "Account ready"}
          </h1>
          {awaitingEmail ? (
            <>
              <p className="text-foreground text-sm leading-relaxed">
                We sent a confirmation link to <span className="font-medium">{email}</span>. Open it to verify your
                account, then you can sign in.
              </p>
              <p className="text-muted-foreground text-sm">Didn&apos;t see it? Check your spam folder.</p>
            </>
          ) : (
            <p className="text-foreground text-sm leading-relaxed">
              Your account is active (email confirmation is off for this project). You can sign in now.
            </p>
          )}
          <Link
            href="/auth/login"
            className={authPrimaryButtonClass + " inline-block w-full text-center no-underline"}
          >
            Go to sign in
          </Link>
          <p className="text-sm text-muted-foreground text-center pt-2">
            <Link href="/" className="text-primary font-medium hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Create account</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Join a community built on faith and encouragement.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="signup-name" className="text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={authInputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={invalid}
              aria-describedby={invalid ? "signup-error" : undefined}
              className={authInputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
              Password <span className="font-normal text-muted-foreground">(min 6 characters)</span>
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              aria-invalid={invalid}
              aria-describedby={invalid ? "signup-error" : undefined}
              className={authInputClass}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground mb-2">Sign up as</legend>
            <div className="flex flex-col gap-3">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md p-1 text-sm text-muted-foreground -m-1 focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                  className="mt-1 accent-primary size-4 shrink-0"
                />
                <span>Regular user (browse, comment & share)</span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md p-1 text-sm text-muted-foreground -m-1 focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="radio"
                  name="role"
                  value="channel_author"
                  checked={role === "channel_author"}
                  onChange={() => setRole("channel_author")}
                  className="mt-1 accent-primary size-4 shrink-0"
                />
                <span>Channel author (create & manage channels)</span>
              </label>
            </div>
          </fieldset>
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-primary rounded border-input"
                aria-describedby="signup-terms-hint"
              />
              <span id="signup-terms-hint">
                I agree to the{" "}
                <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary font-medium underline-offset-2 hover:underline">
                  terms and conditions
                </Link>
                .
              </span>
            </label>
          </div>
          {error && (
            <p id="signup-error" role="alert" className="text-destructive text-sm rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading || !acceptedTerms} className={authPrimaryButtonClass}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
