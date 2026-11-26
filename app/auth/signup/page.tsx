"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessageCircle, Rss, ShieldCheck } from "lucide-react";
import { createImplicitRecoveryClient } from "@/utils/supabase/client";
import { authInputClass, authPrimaryButtonClass } from "@/lib/auth-form-styles";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordRules } from "@/components/password-rules";
import { MIN_PASSWORD_LENGTH, passwordPolicyError } from "@/lib/password-policy";
import { safeNextPath } from "@/lib/safe-next";

const signupBenefits = [
  {
    icon: Rss,
    headline: "Follow channels you love",
    description: "Subscribe to voices that build you up and keep their newest posts close at hand.",
  },
  {
    icon: MessageCircle,
    headline: "Comment and share with the community",
    description: "Encourage others, share what stirred you, and walk together in faith.",
  },
  {
    icon: ShieldCheck,
    headline: "Access a safe, AI-moderated space",
    description: "Conversations stay kind thanks to thoughtful AI moderation.",
  },
] as const;

function SignUpForm() {
  const searchParams = useSearchParams();
  const returnPath = safeNextPath(searchParams.get("next"), "");
  const afterSignup = returnPath.startsWith("/post/") ? returnPath : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
    const policyError = passwordPolicyError(password);
    if (policyError) {
      setError(policyError);
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
          data: { full_name: fullName, role: "user" },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(afterSignup || "/auth/confirmed")}`,
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
        <div className="btw-auth-panel space-y-4" role="status" aria-live="polite">
          <h1 className="btw-page-title">
            {awaitingEmail ? "Check your email" : "Account ready"}
          </h1>
          {awaitingEmail ? (
            <>
              <p className="text-foreground text-sm leading-relaxed">
                We sent a confirmation link to <span className="font-medium">{email}</span>. Open it to verify your
                account, then you can sign in.
                {afterSignup ? " Your post is waiting on this device." : ""}
              </p>
              <p className="text-muted-foreground text-sm">Didn&apos;t see it? Check your spam folder.</p>
            </>
          ) : (
            <p className="text-foreground text-sm leading-relaxed">
              Your account is active (email confirmation is off for this project). You can sign in now.
            </p>
          )}
          <Link
            href={afterSignup ? `/auth/login?next=${encodeURIComponent(afterSignup)}` : "/auth/login"}
            className={authPrimaryButtonClass + " inline-block w-full text-center no-underline"}
          >
            {afterSignup ? "Sign in to publish" : "Go to sign in"}
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
    <div className="mx-auto mt-12 sm:mt-20 w-full max-w-5xl">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-14 lg:items-start">
        <section aria-labelledby="signup-benefits-heading" className="lg:pt-2">
          <h2 id="signup-benefits-heading" className="sr-only">
            Why join Believe The Works
          </h2>
          <ul className="space-y-6">
            {signupBenefits.map(({ icon: Icon, headline, description }) => (
              <li key={headline} className="flex gap-4">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-foreground">{headline}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <div className="btw-auth-panel">
        <h1 className="btw-page-title mb-1">Sign up</h1>
        <p className="btw-lead mb-2">
          Join a community built on faith and encouragement.
        </p>
        <p className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden />
          You&apos;re joining a space moderated by AI for safety and encouragement
        </p>
        <OAuthButtons />
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
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              aria-invalid={invalid}
              aria-describedby={invalid ? "signup-password-rules signup-error" : "signup-password-rules"}
              className={authInputClass}
            />
            <PasswordRules id="signup-password-rules" />
          </div>
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
          <Link
            href={afterSignup ? `/auth/login?next=${encodeURIComponent(afterSignup)}` : "/auth/login"}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
