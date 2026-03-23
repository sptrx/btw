"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

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
    m.includes("code_challenge") ||
    m.includes("code challenge")
  );
}

export function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error" | "pkce_hint">("loading");

  useEffect(() => {
    let cancelled = false;

    const next = searchParams.get("next") ?? "/auth/reset-password";
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const oauthDesc = searchParams.get("error_description");

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

      // 2) PKCE: ?code= — verifier must exist from the same browser session that requested reset.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          if (isPkceVerifierError(error.message)) {
            if (!cancelled) setStatus("pkce_hint");
            return;
          }
          handleFatalError();
          return;
        }
        redirectTo(next);
        return;
      }

      handleFatalError();
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status === "pkce_hint") {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center space-y-4">
        <p className="text-foreground font-medium">Couldn&apos;t complete this link</p>
        <p className="text-muted-foreground text-sm">
          Password reset links that use a security code must be opened in the{" "}
          <strong>same browser</strong> where you requested the reset (so the security step matches).
        </p>
        <p className="text-muted-foreground text-sm">
          Try again: request a new reset email, then open the link in this browser — or paste the link into
          Safari/Chrome if you requested the reset there.
        </p>
        <Link href="/auth/forgot-password" className="inline-block text-primary font-medium hover:underline">
          Request a new reset link
        </Link>
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
