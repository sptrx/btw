"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Provider = "google" | "apple";

/**
 * Multi-color Google "G" logo (Google brand mark — flat 4-color, official paths).
 * Inlined so we don't add new image assets; sized via Tailwind classes on the wrapper.
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

/** Apple logo (solid, white) — sized via Tailwind classes on the wrapper. */
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M17.564 12.62c-.024-2.464 2.012-3.65 2.104-3.708-1.146-1.674-2.928-1.903-3.563-1.929-1.518-.154-2.965.894-3.736.894-.77 0-1.96-.871-3.224-.847-1.66.024-3.19.965-4.043 2.448-1.723 2.984-.44 7.402 1.238 9.829.82 1.187 1.797 2.52 3.083 2.472 1.238-.05 1.706-.802 3.203-.802 1.497 0 1.918.802 3.225.777 1.331-.024 2.175-1.21 2.99-2.402.943-1.38 1.331-2.717 1.355-2.787-.03-.014-2.6-.999-2.632-3.945zM15.193 5.31c.685-.83 1.146-1.984 1.02-3.131-.985.04-2.177.656-2.884 1.484-.635.732-1.19 1.904-1.04 3.029 1.097.085 2.219-.557 2.904-1.382z" />
    </svg>
  );
}

const oauthButtonBaseClass =
  "inline-flex w-full min-h-11 items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-base sm:text-sm font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed";

const googleButtonClass =
  oauthButtonBaseClass +
  " border-border bg-background text-foreground hover:bg-muted";

const appleButtonClass =
  oauthButtonBaseClass +
  " border-transparent bg-black text-white hover:bg-black/90";

export function OAuthButtons() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (provider: Provider) => {
    if (pending) return;
    setError(null);
    setPending(provider);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/onboarding")}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
      // On success Supabase navigates away; keep the disabled state until that happens.
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start sign in");
      setPending(null);
    }
  };

  const isPending = (p: Provider) => pending === p;
  const anyPending = pending !== null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleClick("google")}
        disabled={anyPending}
        aria-label="Continue with Google"
        className={googleButtonClass}
      >
        {isPending("google") ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        <span>Continue with Google</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick("apple")}
        disabled={anyPending}
        aria-label="Continue with Apple"
        className={appleButtonClass}
      >
        {isPending("apple") ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <AppleIcon className="size-5" />
        )}
        <span>Continue with Apple</span>
      </button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">or</span>
        </div>
      </div>
    </div>
  );
}
