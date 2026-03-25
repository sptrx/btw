"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient, createImplicitRecoveryClient } from "@/utils/supabase/client";

/** Recovery / implicit redirect: tokens in URL hash (works in any browser — no PKCE verifier). */
function parseImplicitTokensFromHash(hash: string): {
  access_token: string;
  refresh_token: string;
} | null {
  if (!hash) return null;
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalized);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (access_token && refresh_token) {
    return { access_token, refresh_token };
  }
  return null;
}

function isPkceVerifierError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("code verifier") ||
    m.includes("code_verifier") ||
    m.includes("bad_code_verifier") ||
    m.includes("code_challenge") ||
    m.includes("code challenge") ||
    m.includes("pkce")
  );
}

function isExpiredLinkError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("expired") ||
    m.includes("otp_expired") ||
    m.includes("flow_state") ||
    m.includes("already been used")
  );
}

export function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error" | "pkce_hint">("loading");
  /** Which flow failed when PKCE verifier is missing (for copy + links). */
  const [pkceHintFlow, setPkceHintFlow] = useState<"reset" | "signup" | "other">("other");
  // Stabilize deps: the ReadonlyURLSearchParams object identity can change every render in Next.js 15,
  // which would cancel this effect before setSession / exchangeCodeForSession finishes.
  const searchKey = searchParams.toString();

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams(searchKey);
    // Password reset passes next=/auth/reset-password; signup confirmation passes next=/auth/confirmed.
    const next = params.get("next") ?? "/auth/login";
    const nextForPkceHint =
      next.includes("/auth/reset-password") ? "reset" : next.includes("/auth/confirmed") ? "signup" : "other";
    const code = params.get("code");
    const token_hash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const oauthError = params.get("error");
    const oauthDesc = params.get("error_description");

    const redirectTo = (path: string) => {
      if (!cancelled) window.location.replace(path);
    };

    const handleFatalError = () => {
      if (!cancelled) setStatus("error");
      setTimeout(() => redirectTo(`/auth/login?error=auth_callback_error`), 2500);
    };

    void (async () => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const hashTokens = parseImplicitTokensFromHash(hash);

      if (oauthError) {
        if (!cancelled) setStatus("error");
        setTimeout(
          () =>
            redirectTo(
              `/auth/login?error=${encodeURIComponent(oauthError)}&description=${encodeURIComponent(oauthDesc ?? "")}`
            ),
          2000
        );
        return;
      }

      const supabase = createClient();

      // 1) Implicit / magic-link style: access + refresh in hash — no PKCE verifier needed.
      if (hashTokens) {
        const { error } = await supabase.auth.setSession({
          access_token: hashTokens.access_token,
          refresh_token: hashTokens.refresh_token,
        });
        if (cancelled) return;
        if (error) {
          handleFatalError();
          return;
        }
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        redirectTo(next);
        return;
      }

      // 2) Email template / SSR-style link: ?token_hash=&type=recovery (common with custom SMTP e.g. Resend)
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash });
        if (cancelled) return;
        if (error) {
          handleFatalError();
          return;
        }
        const url = new URL(window.location.href);
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        redirectTo(next);
        return;
      }

      // 3) PKCE: ?code= — code_verifier must match the storage used when the email was sent.
      // createImplicitRecoveryClient() → localStorage (forgot-password + implicit signUp).
      // createClient() (@supabase/ssr) → cookies (e.g. user browsed with the main app client first).
      // Always try both: Supabase error text varies, and mail-app browsers often lack the cookie jar from sign-up.
      if (code) {
        const emailFlow =
          next.includes("/auth/reset-password") || next.includes("/auth/confirmed");
        const implicitFirst = emailFlow;
        const first = implicitFirst ? createImplicitRecoveryClient() : createClient();
        const second = implicitFirst ? createClient() : createImplicitRecoveryClient();

        let firstErr = (await first.auth.exchangeCodeForSession(code)).error;
        if (!firstErr) {
          redirectTo(next);
          return;
        }
        const secondErr = (await second.auth.exchangeCodeForSession(code)).error;

        if (cancelled) return;
        if (!secondErr) {
          redirectTo(next);
          return;
        }

        const msg = (firstErr?.message ?? "") + " " + (secondErr?.message ?? "");
        if (isExpiredLinkError(msg)) {
          handleFatalError();
          return;
        }
        if (isPkceVerifierError(firstErr.message) || isPkceVerifierError(secondErr.message)) {
          if (!cancelled) {
            setPkceHintFlow(nextForPkceHint);
            setStatus("pkce_hint");
          }
          return;
        }
        handleFatalError();
        return;
      }

      handleFatalError();
    })();

    return () => {
      cancelled = true;
    };
  }, [searchKey]);

  if (status === "pkce_hint") {
    const isReset = pkceHintFlow === "reset";
    const isSignup = pkceHintFlow === "signup";
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center space-y-4">
        <p className="text-foreground font-medium">Couldn&apos;t complete this link</p>
        {isReset && (
          <>
            <p className="text-muted-foreground text-sm">
              Password reset links that use a security code must be opened in the{" "}
              <strong>same browser</strong> where you requested the reset (so the security step matches).
            </p>
            <p className="text-muted-foreground text-sm">
              Try again: request a new reset email, then open the link in this browser — or paste the link into
              the browser where you requested the reset.
            </p>
            <Link href="/auth/forgot-password" className="inline-block text-primary font-medium hover:underline">
              Request a new reset link
            </Link>
          </>
        )}
        {isSignup && (
          <>
            <p className="text-muted-foreground text-sm">
              This confirmation link uses a security code that must match the browser where you started sign-up.
              Open the link in the <strong>same browser</strong> you used to register, or sign up again so we send a
              newer link style.
            </p>
            <p className="text-muted-foreground text-sm">
              Prefer opening the email link in your normal browser (not only the mail app’s built-in browser) if
              you hit this after updating the app.
            </p>
            <Link href="/auth/signup" className="inline-block text-primary font-medium hover:underline">
              Back to sign up
            </Link>
          </>
        )}
        {!isReset && !isSignup && (
          <>
            <p className="text-muted-foreground text-sm">
              This link uses a security code that must be opened in the same browser session where you started the
              sign-in or sign-up flow.
            </p>
            <Link href="/auth/login" className="inline-block text-primary font-medium hover:underline">
              Sign in
            </Link>
          </>
        )}
        <p>
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center">
        <p className="text-destructive">Invalid or expired link. Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 text-center">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}
